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
  // callback();

  con.connect(function (err) {
    if (err) throw err;
    console.log("Connected MySQL Database!");

    /***************** CREATE TABLE********************* */

    // var sql =
    //   "CREATE TABLE BIM_360_Project (project VARCHAR(255),project_id VARCHAR(255), K08 VARCHAR(255),K09 VARCHAR(255), name VARCHAR(255), Walls VARCHAR(255), StructuralColumns VARCHAR(255),Time VARCHAR(255))";
    // con.query(sql, function (err, result) {
    //   if (err) throw err;
    //   console.log("Table created");
    // });
    // console.log(con);
    callback();
  });
};
//https://github.com/mysqljs/mysql
function insertData({
  projects,
  bim360Objects,
  objectElements,
  elementProperties,
}) {
  // console.log(project, objects);

  // con.query(
  //   "delete from elements; delete from objects; delete from bim_360_project; delete from project_users;",
  //   project,
  //   function (err, result) {
  //     if (err) throw err;
  //     // insert();
  //   }
  // );
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

    bim360Objects.map((object) => {
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
