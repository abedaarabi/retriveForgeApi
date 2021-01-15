const express = require("express");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const getFile = require("./get");
const { MetaData } = require("./metaData");
const { FolderApi } = require("./folderApi");
const { getStoredToken } = require("./oauth");
const { response } = require("express");

const moeHub_id = "b.c65ce02f-8304-4d1d-8684-e55abb2f54a0";
const hub = "https://developer.api.autodesk.com/project/v1/hubs";

router.get("/projects", async (req, res) => {
  const myToken = getStoredToken();

  const TOKEN = myToken.access_token;

  /**************************************** */

  const hub_Projects = await axios.get(`${hub}/${moeHub_id}/projects`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  //***************************************** */

  const projects = hub_Projects.data.data;

  const folders = await Promise.all(
    projects.map((project) => {
      const projectId = project.id;
      console.log(`Project Id: ${projectId}`);

      //********************************** Top Folder

      const topFolder = `${hub}/${moeHub_id}/projects/${projectId}/topFolders`;

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

  //***************************************** */

  /***************************** */

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
  console.log(derevitveUrns[0]);
  const seachQuery = req.query.q.toLowerCase();
  const objects = derevitveUrns
    .filter((derevitveUrn) => {
      const name = derevitveUrn[2].attributes.displayName;
      return (
        name.endsWith(".rvt") && name.toLowerCase().search(seachQuery) !== -1
      );
    })
    .map((derevitveUrn) => {
      return {
        name: derevitveUrn[2].attributes.displayName,
        projectId: derevitveUrn[0],
        derivativeId: derevitveUrn[1],
        payload: derevitveUrn,
      };
    });

  // TODO: delete me
  res.send(objects);
});

router.post("/metadata", async (req, res) => {
  const myToken = getStoredToken();

  const TOKEN = myToken.access_token;

  const metaDataApi = new MetaData();
  const guids = await metaDataApi.fetchMetadata(req.body);
  const properties = await metaDataApi.fetchProperties(guids);
  console.log(properties);
  res.send(properties);
});

module.exports = router;
