const express = require("express");
const axios = require("axios");
const querystring = require("querystring");
const app = express();
const router = express.Router();
const fs = require("fs");

const dotenv = require("dotenv");
const result = dotenv.config();
const { forge_Id, client_secret } = process.env;
function storeToken(data) {
  fs.writeFileSync(__dirname + "/token.txt", JSON.stringify(data));
}

function getStoredToken() {
  const result = fs.readFileSync(__dirname + "/token.txt");
  return JSON.parse(result.toString());
}

setInterval(() => {
  try {
    const data = getStoredToken();

    // console.log(data.refresh_token);
  } catch (e) {
    console.log(e, "no token yet");
  }
}, 10 * 1000);

router.get("/token/oauth/callback", async (req, res) => {
  console.log(req.query.code);
  const code = req.query.code;

  const result = await authorize(code);
  storeToken(result.data);

  console.log(result.data);

  res.send("Hello World!");
});

async function authorize(code) {
  const url = `https://developer.api.autodesk.com/authentication/v1/gettoken`;
  return axios({
    method: "post",
    url,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      client_id: `${forge_Id}`,
      client_secret: `${client_secret}`,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: "http://younesmln.ngrok.io/token/oauth/callback",
    }),
  });
}

async function refreshToken(token) {
  const url = `https://developer.api.autodesk.com/authentication/v1/gettoken`;
  return axios({
    method: "post",
    url,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      client_id: `${forge_Id}`,
      client_secret: `${client_secret}`,
      grant_type: "refresh_token",
      refresh_token: token,
    }),
  });
}

module.exports = { router, getStoredToken };
