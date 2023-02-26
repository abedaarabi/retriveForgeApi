const axios = require("axios");
const { getStoredToken } = require("./oauth");
const myToken = getStoredToken();
const TOKEN = myToken.access_token;

class FolderApi {
  async fetchFolderContents(folders) {
    const promises = folders.map((project) => {
      // const id = project[0];
      // const urn = project[1].id;
      console.log(project[2].attributes.name);

      const [id, { id: urn }, projectInfo] = project;

      return this.fetchContent(id, urn).then((content) => [
        id,
        content.data,
        projectInfo,
      ]);
      //calling
    });

    const result = await Promise.all(promises);
    // console.log(result);
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
        .catch((err) => err)
    );
  }
}

module.exports = { FolderApi };
