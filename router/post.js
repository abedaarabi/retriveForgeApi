const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const axios = require("axios");

const {} = process.env;
const { getStoredToken } = require("./oauth");
const myToken = getStoredToken();

const TOKEN = myToken.access_token;
//Post job

async function publishModel(projectId, urnId) {
  console.log(projectId, urnId);
  const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/commands`;
  return axios({
    method: "post",
    url,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
    data: JSON.stringify({
      jsonapi: {
        version: "1.0",
      },
      data: {
        type: "commands",
        attributes: {
          extension: {
            type: "commands:autodesk.bim360:C4RModelPublish",
            version: "1.0.0",
          },
        },
        relationships: {
          resources: {
            data: [
              {
                type: "items",
                id: urnId,
              },
            ],
          },
        },
      },
    }),
  });
}

//Get job status

function getPublishModelJob(projectId, urnId) {
  const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/commands`;

  return axios({
    url,
    method: "post",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
    data: JSON.stringify({
      jsonapi: {
        version: "1.0",
      },
      data: {
        type: "commands",
        attributes: {
          extension: {
            type: "commands:autodesk.bim360:C4RModelGetPublishJob",
            version: "1.0.0",
          },
        },
        relationships: {
          resources: {
            data: [
              {
                type: "items",
                id: urnId,
              },
            ],
          },
        },
      },
    }),
  });
}
function translationStatus(projectId, item_id) {
  const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/items/${item_id}`;

  return axios({
    url,

    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
  });
}

module.exports = { publishModel, getPublishModelJob, translationStatus };
