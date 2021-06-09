const axios = require("axios");
const { getStoredToken } = require("./oauth");
const myToken = getStoredToken();
const TOKEN = myToken.access_token;

class MetaData {
  async fetchMetadata(foldersContent) {
    const guids = await Promise.all(
      foldersContent.map(([projectId, id, folderContent]) => {
        const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${id}/metadata`;

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
module.exports = { MetaData };
