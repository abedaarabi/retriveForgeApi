const axios = require("axios");
const { getStoredToken } = require("./oauth");
const myToken = getStoredToken();
const TOKEN = myToken.access_token;

function getHubAndProject() {}

module.exports = { getHubAndProject };
