const axios = require("axios");
const { getStoredToken } = require("./oauth");
const myToken = getStoredToken();
const TOKEN = myToken.access_token;
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

    return metaData.map((user) => ({
      userName: user.name,
      userEmail: user.email,
      userId: user.id,
      projectId: projectId,
    }));
  }
}

module.exports = { User };
