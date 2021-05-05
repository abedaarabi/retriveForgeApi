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
      // console.log(`Project Id: ${projectId}`);

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
        project,
      ]);
    })
  );

  const api = new FolderApi();
  const result = await api.fetchFolderContents(folders);

  const foldersContentPromises = [];

  result.forEach(([projectId, folders, projectInfo]) => {
    const tmp = folders.map((folder) => {
      return api
        .fetchContent(projectId, folder.id)
        .then(
          (content) =>
            content.included && [projectId, content.included, projectInfo]
        );
    });

    foldersContentPromises.push(...tmp);
  });

  const foldersContent = (await Promise.all(foldersContentPromises)).filter(
    (item) => item
  );

  const derevitveUrns = [];
  foldersContent.forEach(([projectId, urns, projectInfo]) => {
    urns.forEach((urn) => {
      if (urn.relationships && urn.relationships.derivatives) {
        const derivative = urn.relationships.derivatives.data.id;
        derevitveUrns.push([projectId, derivative, urn, projectInfo]);
      }
    });
  });

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
        projectName: derevitveUrn[3].attributes.name,
      };
    });

  // TODO: delete me
  res.send(objects);
});

let timeDate = new Date();

router.post("/metadata", async (req, res) => {
  let elements = [];

  const myToken = getStoredToken();

  const TOKEN = myToken.access_token;

  const metaDataApi = new MetaData();
  const guids = await metaDataApi.fetchMetadata(req.body);

  const properties = await metaDataApi.fetchProperties(guids);

  const bim360Objects = properties.map((element) => ({
    projectId: element.attributes.projectId,
    id: element.attributes.id,
    name: element.attributes.displayName,
    date: element.attributes.lastModifiedTime,
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
      // console.log(projectId);

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

  // const jobNumber = Projects_job_number;

  // const moeProjectId = jobNumber.map((item) => ({
  //   id: "b." + item.id,
  //   project_job_number: item.job_number,
  // }));

  // const idMoeForge = bim360Objects.map((item) => {
  //   const myID = item.projectId;
  //   const secondArr = moeProjectId.find((item2) => {
  //     return item2.id === myID;
  //   });
  //   item.project_job_number = secondArr.project_jab_number;
  //   return item;
  // });
  // console.log(idMoeForge);

  //=======================================

  const ele = properties.map((property) => {
    return property.properties.collection
      .map((item) => {
        const elementsId = item.externalId;

        function elementsType(_x, y, z) {
          let boo = item.properties;

          if (boo[y] && boo[y][z]) {
            return boo[y][z];
          }
        }

        const typesName = elementsType(item, "Identity Data", "Type Name");

        const workSet = elementsType(item, "Identity Data", "Workset");
        const typeSorting = elementsType(item, "Identity Data", "Type Sorting");

        const CCSTypeID_Type = elementsType(item, "Other", "CCSTypeID_Type");

        const CCSClassCode_Type = elementsType(
          item,
          "Other",
          "CCSClassCode_Type"
        );
        const CCSTypeID = elementsType(item, "Other", "CCSTypeID");
        /**BIM7AA */
        const BIM7AATypeName = elementsType(item, "Other", "BIM7AATypeName");
        const BIM7AATypeID = elementsType(item, "Other", "BIM7AATypeID");
        const BIM7AATypeDescription = elementsType(
          item,
          "Other",
          "BIM7AATypeDescription"
        );
        const BIM7AATypeNumber = elementsType(
          item,
          "Other",
          "BIM7AATypeNumber"
        );
        const BIM7AATypeCode = elementsType(item, "Other", "BIM7AATypeCode");
        const BIM7AATypeComments = elementsType(
          item,
          "Other",
          "BIM7AATypeComments"
        );

        //******************************* Counted Element ******************************* */

        //*******************************Element Array******************************* */

        const itemElement = {
          name: item.name,
          TypeName: typesName,
          objectId: property.attributes.id,

          externalId: item.externalId,
          Workset: workSet,
          Type_Sorting: typeSorting,
          CCSTypeID: CCSTypeID,
          CCSTypeID_Type: CCSTypeID_Type,
          CCSClassCode_Type: CCSClassCode_Type,
          BIM7AATypeName: BIM7AATypeName,
          BIM7AATypeDescription: BIM7AATypeDescription,
          BIM7AATypeID: BIM7AATypeID,
          BIM7AATypeNumber: BIM7AATypeNumber,
          BIM7AATypeCode: BIM7AATypeCode,
          BIM7AATypeComments: BIM7AATypeComments,
        };
        if (itemElement.TypeName) {
          elements.push(itemElement);
          return itemElement;
        }
      })
      .filter((data) => data);
  });

  // console.log(bim360Objects);
  const objCount = bim360Objects.map((bim360Object, index) => {
    bim360Object.elementsCount = ele[index].length;

    return bim360Object;
  });

  const modiId = objCount.map((objId) => {
    const Id = objId.id.split("?")[0];

    return Id;
  });

  console.log(modiId);
  const body = req.body;

  const projectIds = body.map((data) => {
    const projectName = data[3].attributes.name;
    const projectID = data[0];
    return { projectName, projectID };
  });

  res.send({ objCount, projectIds, elements, modiId });
  insertData({
    projects: projectIds,
    items: objCount,
    elements: elements,
    modiId,
  });
});

module.exports = router;
