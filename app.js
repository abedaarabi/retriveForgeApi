const express = require("express");
const app = express();
const dotenv = require("dotenv");
const result = dotenv.config();
const bodyParser = require("body-parser");

const { connect } = require("./router/database");

app.use(express.static("client"));

const getRoute = require("./router/get");
const PORT = process.env.PORT;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", getRoute);

// app.use("/api/forge", oauthRouter);

const stratServer = function () {
  app.listen(PORT, console.log(`server is running on ${PORT} ` || 8080));
};

connect(stratServer);
