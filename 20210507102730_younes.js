// exports.up = function (knex) {
//   return knex.schema.alterTable("element", (table) => {
//     table.string("youns");
//   });
// };

// exports.down = function (knex) {
//   return knex.schema.alterTable("element", (table) => {
//     table.dropColumn("youns");
//   });
// };

const dotenv = require("dotenv");
const result = dotenv.config();
const mysql = require("mysql");
const helper = require("../app");
// const loading = require("../client/main");

const { sqlPassword } = process.env;

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: sqlPassword,
  database: "MOE",
  multipleStatements: true,
});
const connect = function (callback) {
  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected MySQL Database!");

    callback();
  });
};
//https://github.com/mysqljs/mysql
function insertData({ projects, objects, objectElements, elementProperties }) {
  // console.log(project, objects);

  insert();
  function insert() {
    const err = "externalId are exist";

    projects.map((project) => {
      con.query(
        "INSERT INTO BIM_360_Project SET ?",
        project,
        function (err, result) {
          console.log(result);
        }
      );
    });

    objects.map((object) => {
      con.query("INSERT INTO objects SET ?", object, function (err, result) {
        // console.log(result);
      });
    });

    objectElements.map((element) => {
      con.query("INSERT INTO elements SET ?", element, function (err, result) {
        // console.log("1 record inserted in element");
        console.log(result);
      });
    });

    elementProperties.map((element) => {
      con.query(
        "INSERT INTO elementproperties SET ?",
        element,
        function (err, result) {
          // console.log("1 record inserted in element");
          if (result) {
            console.log("New Properties Added");
          }
        }
      );
    });
  }
}

module.exports = { connect, insertData };
