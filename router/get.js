const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const axios = require("axios");
const { insertData } = require("../router/database");
const { publishModel } = require("../router/post");

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
  const projectsName = projects[0].attributes.name;
  console.log(projectsName);

  //ONLY for 1 project otherwaies you most loop

  const folders = await Promise.all(
    projects.map((project) => {
      const projectId = project.id;
      // console.log({ projectId });

      const topFolder = `${hub}/${moeHub_id}/projects/${projectId}/topFolders`;
      const top = axios
        .get(topFolder, {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
          },
        })

        .catch(() => [projectId, []]); //if there are error returen empty
      return top.then((e) => [projectId, e.data.data[0]]);
    })
  );

  const api = new FolderApi();
  const result = await api.fetchFolderContents(folders);

  const projectId = folders[0][0]; // 1 project only!!

  /************* USER INFORMATION class *************** */

  const userMetaData = new User();
  const users = await userMetaData.userInfo(projectId);

  const foldersContentPromises = result.map((folder) => {
    return api
      .fetchContent(projectId, folder.id)
      .then((content) => content.included[0]);
  });

  const foldersContent = await Promise.all(foldersContentPromises);
  const originalItemUrns = foldersContent
    .map((itemUrn) => {
      return itemUrn.attributes.extension.data.originalItemUrn;
    })
    .filter((itemUrns) => {
      if (itemUrns == null) {
        return false;
      } else {
        return true;
      }
    });
  await publishModel(projectId, originalItemUrns[1]);
  res.send(originalItemUrns);
  return;
  // res.send(originalItemUrns);

  // res.send(derivativesIds);
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

  const project = {
    projectName: projectsName,
    projectId,
  };

  const objects = [
    {
      projectId,
      id: structureElement.attributes.id,
      name: structureElement.attributes.displayName,
    },
    {
      projectId,
      id: elElement.attributes.id,
      name: elElement.attributes.displayName,
    },
    {
      projectId,
      id: mepElement.attributes.id,
      name: mepElement.attributes.displayName,
    },

    {
      projectId,
      id: archElement.attributes.id,
      name: archElement.attributes.displayName,
    },
  ];

  //const walls = wallOpject.properties.collection;
  const objectElements = [];

  properties
    .filter((property) =>
      [
        "LLYN.B357_K08_F02_N900.rvt",
        "LLYN.B357_K09_F2_N01.rvt",
        "LLYN.B357_K07_F02_N01.rvt",
        "LLYN.B357_K01_F02_N01.rvt",
      ].includes(property.attributes.name)
    )
    .forEach((property) => {
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
  insertData({ project, objects, objectElements, users });
});

class User {
  async userInfo(projectId) {
    const url = `https://developer.api.autodesk.com/bim360/admin/v1/projects/${projectId}/users`,
      contents = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
        },
      });

    const metaData = await contents.data.results;

    return metaData.map((user) => ({
      userName: user.name,
      userEmail: user.email,
      userId: user.id,
      projectId: projectId,
    }));
  }
}

class FolderApi {
  async fetchFolderContents(folders) {
    const promises = folders.map((project) => {
      // const id = project[0];
      // const urn = project[1].id;
      const [id, { id: urn }] = project;
      return this.fetchContent(id, urn).then((content) => content.data);
      //calling
    });

    const result = await Promise.all(promises);
    return result[0]; //only a project
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
      foldersContent.map((folderContent) => {
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
            metadaEntry.guid,
            { ...folderContent.attributes, id: folderContent.id },
          ];
        });
      })
    );
    return guids;
  }

  async fetchProperties(guids) {
    const data = await Promise.all(
      guids.map(([urn, guid, attributes]) => {
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/metadata/${guid}/properties?forceget=true`;
        const contents = axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${TOKEN}`,
            },
          })
          .catch((e) => e);
        return contents.then((response) => ({
          attributes,
          properties: response.data.data,
        }));
        // .then((data) => console.log(data));
      })
    );

    return data;
  }
}

module.exports = router;
