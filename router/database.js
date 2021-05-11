const dotenv = require("dotenv");
const result = dotenv.config();
// const mysql = require("mysql");
const { resolve } = require("path");
const helper = require("../app");
const sql = require("mssql");
const path = require("path");
require("dotenv").config({ path: "../.env" });

const con = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  options: {
    trustedConnection: true,
    encrypt: true,
    enableArithAbort: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const connect = async () => {
  try {
    // make sure that any items are correctly URL encoded in the connection string
    await sql.connect(con);

    console.log("result");
  } catch (err) {
    // ... error checks
    console.log(err);
  }
};

function sqlElement() {
  return new Promise((resolve, reject) => {
    con.query("SELECT * FROM element", function (err, result, fields) {
      if (err) throw err;

      resolve(result);
    });
  });
}

async function insertData({ projects, items, elements, modiId }) {
  // console.log(project, objects);
  const boo = await sqlElement();

  modiId.map((id) => {
    con.query(
      `DELETE FROM element WHERE objectId LIKE '%${id}%'`,

      function (err, result) {
        if (err) throw err;
        console.log(err);
      }
    );
  });
  insert();
  function insert() {
    const err = "externalId are exist";

    projects.map((project) => {
      con.query(
        "INSERT INTO project_name SET ?",
        project,
        function (err, result) {
          console.log(result);
        }
      );
    });

    items.map((object) => {
      con.query("INSERT INTO item_name SET ?", object, function (err, result) {
        console.log(err);
      });
    });

    elements.map((element) => {
      con.query("INSERT INTO element SET ?", element, function (err, result) {
        // console.log("1 record inserted in element");
        console.log(result);
      });
    });

    // elementProperties.map((element) => {
    //   con.query(
    //     "INSERT INTO elementproperties SET ?",
    //     element,
    //     function (err, result) {
    //       // console.log("1 record inserted in element");
    //       if (result) {
    //         console.log("New Properties Added");
    //       }
    //     }
    //   );
    // });

    // users.map((user) => {
    //   con.query("INSERT INTO project_users SET ?", user, function (
    //     err,
    //     result
    //   ) {
    //     // console.log(result);
    //     // console.log("1 record inserted in element");
    //   });
    // });
  }
}
module.exports = { connect, insertData };
