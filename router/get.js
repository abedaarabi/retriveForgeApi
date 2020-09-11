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
const { log } = require("console");
const { getStoredToken } = require("./oauth");
const { loadavg } = require("os");
const { emitWarning } = require("process");

const myToken = getStoredToken();

const TOKEN = myToken.access_token;
console.log(TOKEN);
const {
  forge_urn,
  hub_id,
  hub,
  issue_ID,
  forge_host,
  forge,

  refreshtoken,
  forge_download,
} = process.env;

router.get("/", (_req, res) => {
  const indexFilePath = path.resolve(__dirname, "../client/index.html");
  res.sendFile(indexFilePath);
});

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

router.get("/hubs", async (_req, res) => {
  const myToken = getStoredToken();

  const TOKEN = myToken.access_token;

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

  const folders = await Promise.all(
    projects.map((project) => {
      const projectId = project.id;
      console.log(`Project Id: ${projectId}`);

      //********************************** Top Folder

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

        e.data.data.find(
          (folder) => folder.attributes.name === "Project Files"
        ),
      ]);
    })
  );

  //******************************* Folder Contents
  const api = new FolderApi();
  const result = await api.fetchFolderContents(folders);
  const foldersContentPromises = [];
  result.forEach(([projectId, folders]) => {
    const tmp = folders.map((folder) => {
      return api
        .fetchContent(projectId, folder.id)
        .then((content) => content.included && [projectId, content.included]);
    });

    foldersContentPromises.push(...tmp);
  });

  const foldersContent = (await Promise.all(foldersContentPromises)).filter(
    (item) => item
  );

  const derevitveUrns = [];
  foldersContent.forEach(([projectId, urns]) => {
    urns.forEach((urn) => {
      if (urn.relationships && urn.relationships.derivatives) {
        const derivative = urn.relationships.derivatives.data.id;
        derevitveUrns.push([projectId, derivative, urn]);
      }
    });
  });

  console.log("start");

  //**********************TRANSLATION*************************** */
  // await Promise.all(
  //   originalItemUrns.map(([projectId, originalItemUrn]) =>
  //     publishModel(projectId, originalItemUrn)
  //   )
  // );

  // // make sure all projects been translated
  // let allStatus;

  // while (!allStatus) {
  //   console.log("waiting for Translation to start");
  //   await delay(10000);
  //   const translatesStatus = await Promise.all(
  //     originalItemUrns.map(([projectId, originalItemUrn]) => {
  //       // console.log("testfgsdjhgdas", projectId, originalItemUrn);
  //       return getPublishModelJob(projectId, originalItemUrn)
  //         .then((response) => response.data.data)
  //         .catch((err) => {
  //           console.log(err);
  //           return [];
  //         });
  //     })
  //   );

  //   // translateStatus.push({ attributes: { status: "notyet" } });

  //   allStatus = translatesStatus.every((data) => {
  //     console.log(data);
  //     if (!data || !data.attributes) return false;
  //     // else if (data == null) console.log("Model Needs Publishing ");
  //     return data.attributes.status === "complete";
  //   });
  //   console.log(allStatus);
  // }

  // // ****************** make sure all projects been translated
  // let allItemStatus;

  // while (!allItemStatus) {
  //   console.log("waiting for Translation to complete");
  //   await delay(10000);
  //   const translatesStatus = await Promise.all(
  //     originalItemUrns.map(([projectId, originalItemUrn]) => {
  //       // console.log("testfgsdjhgdas", projectId, originalItemUrn);
  //       return translationStatus(projectId, originalItemUrn)
  //         .then(
  //           (response) =>
  //             response.data.included[0].attributes.extension.data.processState
  //         )

  //         .catch((err) => {
  //           console.log(err);
  //           return [];
  //         });
  //     })
  //   );

  //   // translateStatus.push({ attributes: { status: "notyet" } });

  //   allItemStatus = translatesStatus.every((data) => {
  //     return data === "PROCESSING_COMPLETE";
  //   });

  //   console.log(allItemStatus);
  // }
  // res.send(allStatus);
  // return;
  //***************************** User Information
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

  // **************************** Classes

  const metaDataApi = new MetaData();
  const guids = await metaDataApi.fetchMetadata(derevitveUrns);
  // console.log(guids)
  guids.forEach((guid, index) => console.log(guid[2].name, index));

  const properties = await metaDataApi.fetchProperties([guids[5]]);
  res.send(properties);
  const regex = /\w+\K[0-9]{2,3}_F[0-9]{1,3}.*?\.rvt/gi;

  // function objectName(b) {
  //   return properties.find((property) => property.attributes.name === b);
  // }
  function objectName(b) {
    return properties.filter((property) => property.attributes.name == b);
  }
  // const foo = objectName(regex);
  // console.log(foo);

  const structureElement = objectName("UN17_K08_F2_VVS.rvt");

  // const mepElement = objectName(regex);
  // const elElement = objectName(regex);
  // const archElement = objectName(regex);

  let timeDate = new Date();

  const formattedProjects = projects.map((project) => ({
    projectName: project.attributes.name,

    projectId: project.id,
  }));

  const objects = structureElement.map((element) => ({
    projectId: element.attributes.projectId,
    id: element.attributes.id,
    name: element.attributes.displayName,
  }));

  let objectElements = [];
  structureElement.forEach((property) => {
    property.properties.collection.forEach((item) => {
      const elementsId = item.externalId;

      function elementsType(_x, y, z) {
        let boo = item.properties;
        if (boo && boo[y]) {
          return boo[y][z];
        }
      }

      const typesName = elementsType(item, "Identity Data", "Type Name");

      // console.log(`Element: ${item.name} Type: ${typesName}`);

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

  insertData({
    projects: formattedProjects,
    objects,
    objectElements,
    users: users[1],
  });
  // function to instert the data to MySQL
});

class User {
  async userInfo(projectId) {
    const url = `https://developer.api.autodesk.com/bim360/admin/v1/projects/${projectId}/users?limit=200`,
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
      console.log(project);

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
      foldersContent.map(([projectId, id, folderContent]) => {
        // const id = folderContent.relationships.derivatives.data.id;
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${id}/metadata`;
        // console.log(url);
        const contentsPromise = axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          })
          .catch((e) => e);
        return contentsPromise.then((response) => {
          let metadaEntry;

          if (!response.data) {
            return;
          }
          metadaEntry = response.data.data.metadata.find(
            (metadata) => metadata.role === "3d"
          );

          if (!(metadaEntry && metadaEntry.guid)) {
            return;
          }

          return [
            id,
            metadaEntry && metadaEntry.guid,
            { ...folderContent, ...folderContent.attributes, projectId },
          ];
        });
      })
    );

    return guids.filter((guid) => guid);
  }

  async fetchProperties(guids) {
    const data = await Promise.all(
      guids.map(([urn, guid, attributes]) => {
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties?forceget=true`;
        // console.log(url);
        const contents = axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          })
          .catch((e) => e);
        return contents.then((response) => {
          if (!response.data) {
            return;
          }
          return {
            attributes,
            properties: response.data.data,
          };
        });
        // .then((data) => console.log(data));
      })
    );

    return data.filter((data) => data);
  }
}

module.exports = router;
