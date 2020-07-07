const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const axios = require("axios");
const { insertData } = require("../router/database");
const {
  publishModel,
  getPublishModelJob,
  translationStatus,
} = require("../router/post");
const { reset } = require("nodemon");

const {
  forge_urn,
  hub_id,
  hub,
  issue_ID,
  forge_host,
  forge,
  TOKEN,
  refreshtoken,
  forge_download,
} = process.env;

router.get("/", (req, res) => {
  const indexFilePath = path.resolve(__dirname, "../client/index.html");
  res.sendFile(indexFilePath);
});

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// publishModel(
//   "b.d4272d0d-557d-4a6d-b45e-9db2ea0c4cc4",
//   "urn:adsk.wipprod:dm.lineage:pugXMoPgTEGT4MUKIbdtWA"
// ).then((c) => console.log(c.data));

// getPublishModelJob(
//   "b.d4272d0d-557d-4a6d-b45e-9db2ea0c4cc4",
//   "urn:adsk.wipprod:dm.lineage:pugXMoPgTEGT4MUKIbdtWA"
// ).then((d) => {
//   console.log(d.data);
// });

// Promise.all(
//   [
//     "urn:adsk.wipprod:dm.lineage:pugXMoPgTEGT4MUKIbdtWA",
//     "urn:adsk.wipprod:dm.lineage:wlQJlV7dTveU08gaYyOQ7w",
//     "urn:adsk.wipprod:dm.lineage:QXtjlQAeSHe90gWWBYtM2g",
//     "urn:adsk.wipprod:dm.lineage:JzpplYIhR3yLQ3PxNLjsqg",
//   ].map((originalItemUrn) => {
//     return getPublishModelJob(
//       "b.d4272d0d-557d-4a6d-b45e-9db2ea0c4cc4",
//       originalItemUrn
//     ).then(
//       () => console.log("done"),
//       (err) => {
//         console.log("ttttttttttttttttttttttt", err);
//         return [];
//       }
//     );
//   })
// );

router.get("/hubs", async (req, res) => {
  const response = await axios.get(`${hub}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });
  const { data } = response;
  const moeHub_id = data.data[0].id;
  const hub_Projects = await axios.get(`${hub}/${moeHub_id}/projects`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  const projects = hub_Projects.data.data;

  console.log("start");

  //ONLY for 1 project otherwaies you most loop

  const folders = await Promise.all(
    projects.map((project) => {
      const projectId = project.id;
      // console.log({ projectId });

      const topFolder = `${hub}/${moeHub_id}/projects/${projectId}/topFolders`;
      console.log(topFolder);
      const top = axios
        .get(topFolder, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        })

        .catch(() => [projectId, []]); //if there are error returen empty
      return top.then((e) => [
        projectId,
        e.data.data.find((folder) => folder.attributes.name !== "Plans"),
      ]);
    })
  );

  const api = new FolderApi();
  const result = await api.fetchFolderContents(folders);

  console.log(result);
  /************* USER INFORMATION class *************** */

  const foldersContentPromises = [];
  result.forEach(([projectId, folders]) => {
    const tmp = folders.map((folder) => {
      return api
        .fetchContent(projectId, folder.id)
        .then(
          (content) => content.included && [projectId, content.included[0]]
        );
    });

    foldersContentPromises.push(...tmp);
  });

  const foldersContent = (await Promise.all(foldersContentPromises)).filter(
    (item) => item
  );

  const originalItemUrns = foldersContent
    .map(([projectId, itemUrn]) => {
      console.log(itemUrn.attributes.extension.data.originalItemUrn);

      return [projectId, itemUrn.attributes.extension.data.originalItemUrn];
    })
    .filter(([, itemUrns]) => itemUrns); // returen only True

  console.log("start");
  await Promise.all(
    originalItemUrns.map(([projectId, originalItemUrn]) =>
      publishModel(projectId, originalItemUrn)
    )
  );

  // make sure all projects been translated
  let allStatus;

  while (!allStatus) {
    console.log("waiting for it to start");
    await delay(30000);
    const translatesStatus = await Promise.all(
      originalItemUrns.map(([projectId, originalItemUrn]) => {
        // console.log("testfgsdjhgdas", projectId, originalItemUrn);
        return getPublishModelJob(projectId, originalItemUrn)
          .then((response) => response.data.data)
          .catch((err) => {
            console.log(err);
            return [];
          });
      })
    );

    // translateStatus.push({ attributes: { status: "notyet" } });

    allStatus = translatesStatus.every((data) => {
      console.log(data);
      if (!data || !data.attributes) return false;
      return data.attributes.status === "complete";
    });
    console.log(allStatus);
  }

  // ****************** make sure all projects been translated
  let allItemStatus;

  while (!allItemStatus) {
    console.log("waiting for to complete");
    await delay(30000);
    const translatesStatus = await Promise.all(
      originalItemUrns.map(([projectId, originalItemUrn]) => {
        // console.log("testfgsdjhgdas", projectId, originalItemUrn);
        return translationStatus(projectId, originalItemUrn)
          .then(
            (response) =>
              response.data.included[0].attributes.extension.data.processState
          )
          .catch((err) => {
            console.log(err);
            return [];
          });
      })
    );

    // translateStatus.push({ attributes: { status: "notyet" } });

    allItemStatus = translatesStatus.every((data) => {
      return data === "PROCESSING_COMPLETE";
    });
    console.log(allItemStatus);
  }
  // res.send(allStatus);

  // res.send(originalItemUrns);
  const userMetaData = new User();

  const usersNested = await Promise.all(
    projects.map((project) => {
      return userMetaData.userInfo(project.id);
    })
  );

  const users = [];
  usersNested.forEach((nestedUser) => {
    users.push(...nestedUser);
  });

  console.log(users);

  // res.send(users);

  const metaDataApi = new MetaData();
  const guids = await metaDataApi.fetchMetadata(foldersContent);
  const properties = await metaDataApi.fetchProperties(guids);

  function objectName(b) {
    return properties.find((property) => property.attributes.name === b);
  }

  const structureElement = objectName("LLYN.B357_K09_F2_N01.rvt");
  const mepElement = objectName("LLYN.B357_K08_F02_N900.rvt");
  const elElement = objectName("LLYN.B357_K07_F02_N01.rvt");
  const archElement = objectName("LLYN.B357_K01_F02_N01.rvt");

  let timeDate = new Date();

  const formattedProjects = projects.map((project) => ({
    projectName: project.attributes.name,
    projectId: project.id,
  }));

  const objects = [
    {
      projectId: archElement.attributes.projectId,
      id: structureElement.attributes.id,
      name: structureElement.attributes.displayName,
    },
    {
      projectId: archElement.attributes.projectId,
      id: elElement.attributes.id,
      name: elElement.attributes.displayName,
    },
    {
      projectId: archElement.attributes.projectId,
      id: mepElement.attributes.id,
      name: mepElement.attributes.displayName,
    },

    {
      projectId: archElement.attributes.projectId,
      id: archElement.attributes.id,
      name: archElement.attributes.displayName,
    },
  ];

  console.log(objects);

  //const walls = wallOpject.properties.collection;
  const objectElements = [];
  const regex = /K[0-9]{2,3}_F[0-9]{1,3}.*?\.rvt/gi;
  await delay(15000);
  properties
    .filter((property) => property.attributes.name.match(regex))
    .forEach((property) => {
      console.log(property.attributes.name);
      // console.log(property.attributes);
      //["Identity Data"]["Type Name"];
      property.properties.collection.forEach((item) => {
        //****************bug (collection)

        const elementsId = item.externalId;

        function elementsType(x, y, z) {
          let boo = item.properties;
          if (boo && boo[y]) {
            return boo[y][z];
          }
        }

        const typesName = elementsType(item, "Identity Data", "Type Name");
        // const abed = name(item, "Construction", "Function");

        const itemElement = {
          name: item.name,
          TypeName: typesName,
          objectId: property.attributes.id,
          time: timeDate,
          externalId: item.externalId,
        };
        objectElements.push(itemElement);
      });
    });
  // function to instert the data to MySQL
  insertData({ projects: formattedProjects, objects, objectElements, users });
  res.send(objectElements);
});

class User {
  async userInfo(projectId) {
    const url = `https://developer.api.autodesk.com/bim360/admin/v1/projects/${projectId}/users`,
      contents = await axios({
        url,
        method: "get",
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

    const metaData = await contents.data.results;

    return [
      projectId,
      metaData.map((user) => ({
        userName: user.name,
        userEmail: user.email,
        userId: user.id,
        projectId: projectId,
      })),
    ];
  }
}

class FolderApi {
  async fetchFolderContents(folders) {
    const promises = folders.map((project) => {
      // const id = project[0];
      // const urn = project[1].id;
      const [id, { id: urn }] = project;
      return this.fetchContent(id, urn).then((content) => [id, content.data]);
      //calling
    });

    const result = await Promise.all(promises);

    return result; //only a project
  }
  //fetchContent IS taking from fetchFolderContents
  fetchContent(id, urn) {
    const urnFolder = `https://developer.api.autodesk.com/data/v1/projects/${id}/folders/${urn}/contents`;

    return (
      axios
        .get(urnFolder, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        })
        // .then((x) => (console.log(x.data), x))
        .then((response) => response.data)
    );
  }
}

class MetaData {
  async fetchMetadata(foldersContent) {
    const guids = await Promise.all(
      foldersContent.map(([projectId, folderContent]) => {
        const id = folderContent.relationships.derivatives.data.id;
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${id}/metadata`;
        // console.log(url);
        const contents = axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          })
          .catch((e) => e);
        return contents.then((response) => {
          const metadaEntry = response.data.data.metadata.find(
            (metadata) => metadata.role === "3d"
          );
          return [
            id,
            metadaEntry && metadaEntry.guid,
            { ...folderContent.attributes, id: folderContent.id, projectId },
          ];
        });
      })
    );
    return guids.filter((guid) => guid[1]);
  }

  async fetchProperties(guids) {
    const data = await Promise.all(
      guids.map(([urn, guid, attributes]) => {
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties?forceget=true`;
        console.log(url);
        const contents = axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          })
          .catch((e) => e);
        return contents.then((response) => ({
          attributes,
          properties: console.log(response.data.data) || response.data.data,
        }));
        // .then((data) => console.log(data));
      })
    );

    return data;
  }
}

module.exports = router;
