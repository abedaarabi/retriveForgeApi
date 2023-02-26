const express = require("express");
const app = express();
const dotenv = require("dotenv");
const result = dotenv.config();
const bodyParser = require("body-parser");

const { connect } = require("./router/database");
const projectName = require("./router/projectsName");

app.use(express.static("client"));

const getRoute = require("./router/get");
const { router } = require("./router/oauth");
const PORT = process.env.PORT;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", projectName);
app.use("/", getRoute);
app.use("/", router);

// app.use("/api/forge", oauthRouter);

(async () => {
  const stratServer = () => {
    app.listen(PORT, console.log(`server is running on ${PORT} ` || 8080));
  };
  await connect();
  stratServer();
})();
