// Update with your config settings.

const path = require("path");
require("dotenv").config({ path: "../.env" });

module.exports = {
  development: {
    client: "mssql",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: { min: 0, max: 7 },
    seeds: {
      directory: path.join(__dirname, "/db/seeds/development"),
    },
  },
  production: {
    client: "mssql",
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    pool: { min: 0, max: 7 },
    seeds: {
      directory: path.join(__dirname, "/db/seeds/production"),
    },
  },
};
