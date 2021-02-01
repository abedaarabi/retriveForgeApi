const express = require("express");
const router = express.Router();
const path = require("path");
const axios = require("axios");
const getFile = require("./get");
const { MetaData } = require("./metaData");
const { FolderApi } = require("./folderApi");
const { getStoredToken } = require("./oauth");
const { response } = require("express");
const { insertData } = require("../router/database");
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

  let projects = hub_Projects.data.data;

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
let timeDate = new Date();

router.post("/metadata", async (req, res) => {
  const myToken = getStoredToken();

  const TOKEN = myToken.access_token;

  const metaDataApi = new MetaData();
  const guids = await metaDataApi.fetchMetadata(req.body);
  const properties = await metaDataApi.fetchProperties(guids);

  const bim360Objects = properties.map((element) => ({
    projectId: element.attributes.projectId,
    id: element.attributes.id,
    name: element.attributes.displayName,
  }));

  //=======================================

  //***************************************** */
  const { tokenBody } = process.env;
  const tokenResponse = await axios({
    url: "https://developer.api.autodesk.com/authentication/v1/authenticate",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: tokenBody,
  }).catch((err) => err);

  const accessToken = await tokenResponse.data.access_token;

  const Projects_job_number = await Promise.all(
    bim360Objects.map((project) => {
      const projectId = project.projectId.substring(1 && 2);
      console.log(projectId);

      const account_ID = "c65ce02f-8304-4d1d-8684-e55abb2f54a0";
      const response = axios
        .get(
          `https://developer.api.autodesk.com/hq/v1/accounts/${account_ID}/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        .catch((err) => console.log(err));
      return response.then((data) => data.data);
    })
  );
  /***************************** */

  //********Push MOE ProjectID to the database********

  const jobNumber = Projects_job_number;

  const moeProjectId = jobNumber.map((item) => ({
    id: "b." + item.id,
    project_jab_number: item.job_number,
  }));

  const idMoeForge = bim360Objects.map((item) => {
    const myID = item.projectId;
    const secondArr = moeProjectId.find((item2) => {
      return item2.id === myID;
    });
    item.project_jab_number = secondArr.project_jab_number;
    return item;
  });

  //=======================================

  let objectElements = [];
  let elementProperties = [];

  console.log(bim360Objects);
  properties.forEach((property) => {
    property.properties.collection.forEach((item) => {
      const elementsId = item.externalId;

      function elementsType(_x, y, z) {
        let boo = item.properties;
        if (boo && boo[y]) {
          return boo[y][z];
        }
      }

      const typesName = elementsType(item, "Identity Data", "Type Name");
      const workSet = elementsType(item, "Identity Data", "Workset");
      let typeSorting = elementsType(item, "Identity Data", "Type Sorting");

      const CCSTypeID_Type = elementsType(item, "Other", "CCSTypeID_Type");
      const CCSClassCode_Type = elementsType(
        item,
        "Other",
        "CCSClassCode_Type"
      );
      const CCSTypeID = elementsType(item, "Other", "CCSTypeID");

      // console.log(`Element: ${item.name} Type: ${typesName}`);

      const itemElement = {
        name: item.name,
        TypeName: typesName,

        objectId: property.attributes.id,
        time: timeDate,
        externalId: item.externalId,
        // Workset: workSet,
        // Type_Sorting: typeSorting,
        // CCSTypeID: CCSTypeID,
        // CCSTypeID_Type: CCSTypeID_Type,
        // CCSClassCode_Type: CCSClassCode_Type,
      };
      objectElements.push(itemElement);

      const EleProperty = {
        externalId: item.externalId,
        time: timeDate,
        Workset: workSet,
        Type_Sorting: typeSorting,
        CCSTypeID: CCSTypeID,
        CCSTypeID_Type: CCSTypeID_Type,
        CCSClassCode_Type: CCSClassCode_Type,
      };

      elementProperties.push(EleProperty);
      // console.log(">>>>>>>>>>>>", EleProperty);
    });
  });

  insertData({
    projects: idMoeForge,
    bim360Objects,
    objectElements,
    elementProperties,
    // users: users,
  });
});

module.exports = router;
