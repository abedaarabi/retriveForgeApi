const express = require("express");
const app = express();
const router = express.Router();
const path = require("path");
const axios = require("axios");

const { TOKEN } = process.env;

//Post job
async function publishModel(projectId, urnId) {
  const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/commands`;
  return await axios.post(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
    data: {
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
            data: [{ type: "items", id: `${urnId}` }],
          },
        },
      },
    },
  });
}

//Get job status
// async function getPublishModelJob(projectId, urnId) {
//   const url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/commands
//     `;
//   return await axios.post(url, {
//     headers: {
//       Authorization: `Bearer ${TOKEN}`,
//     },
//     jsonapi: {
//       version: "1.0",
//     },
//     data: {
//       type: "commands",
//       attributes: {
//         extension: {
//           type: "commands:autodesk.bim360:C4RModelGetPublishJob",
//           version: "1.0.0",
//         },
//       },
//       relationships: {
//         resources: {
//           data: [{ type: "items", id: `${urnId}` }],
//         },
//       },
//     },
//   });
// }

module.exports = { publishModel };
