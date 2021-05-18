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
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 100000,
  },
};

const connect = async () => {
  try {
    const pool = await sql.connect(con);

    console.log(`Connecting to database ${pool.config.user}`);
  } catch (err) {
    console.log(`Error ${err}`);
  }
};

async function insertData({ projects, items, elements, modiId }) {
  modiId.map((id) => {
    sql.query(
      `DELETE FROM element WHERE objectId LIKE '%${id}%'`,

      function (err, result) {
        if (err) console.log(`Error ${err.message}`);
        else {
          console.log(result);
        }
      }
    );
  });

  async function insert() {
    //projects
    let tablePro = new sql.Table("project_name");
    const request = new sql.Request();
    tablePro.create = true;
    tablePro.columns.add("projectID", sql.VarChar(255), {
      nullable: false,
      primary: true,
    });
    tablePro.columns.add("projectName", sql.VarChar(255), {
      nullable: false,
      primary: true,
    });
    await projects.map((project) => {
      return tablePro.rows.add(project.projectID, project.projectName);
    });
    request.bulk(tablePro, (err, result) => {
      if (err) console.log(`Error ${err.message}`);
      else {
        console.log(result);
      }
    });
    //items

    // const request = new sql.Request();
    let tableItem = new sql.Table("item_name");

    tableItem.create = true;
    tableItem.columns.add("date", sql.VarChar(255), {
      nullable: false,
      unique: true,
    });
    tableItem.columns.add("elementsCount", sql.Int());
    tableItem.columns.add("id", sql.VarChar(255), {
      nullable: false,
      primary: true,
      unique: true,
    });
    tableItem.columns.add("name", sql.VarChar(255));
    tableItem.columns.add("projectId", sql.VarChar(255), {
      nullable: false,
    });
    await items.map((object) => {
      return tableItem.rows.add(
        object.date,
        object.elementsCount,
        object.id,
        object.name,
        object.projectId
      );
    });
    request.bulk(tableItem, (err, result) => {
      if (err) console.log(`Error ${err.message}`);
      else {
        console.log(result);
      }
    });
    //elements
    let tableElt = new sql.Table("element");
    tableElt.create = true;
    tableElt.columns.add("name", sql.VarChar(255));
    tableElt.columns.add("TypeName", sql.VarChar(255));
    tableElt.columns.add("Type_Sorting", sql.VarChar(255));
    tableElt.columns.add("Workset", sql.VarChar(255));
    tableElt.columns.add("CCSTypeID_Type", sql.VarChar(255));
    tableElt.columns.add("CCSTypeID", sql.VarChar(255));
    tableElt.columns.add("CCSClassCode_Type", sql.VarChar(255));
    tableElt.columns.add("externalId", sql.VarChar(255));
    tableElt.columns.add("objectId", sql.VarChar(255), {
      nullable: false,
    });
    tableElt.columns.add("BIM7AATypeName", sql.VarChar(255));
    tableElt.columns.add("BIM7AATypeDescription", sql.VarChar(255));
    tableElt.columns.add("BIM7AATypeID", sql.VarChar(255));
    tableElt.columns.add("BIM7AATypeNumber", sql.VarChar(255));
    tableElt.columns.add("BIM7AATypeCode", sql.VarChar(255));
    tableElt.columns.add("BIM7AATypeComments", sql.VarChar(255));

    await elements.map(async (element) => {
      return tableElt.rows.add(
        element.name,
        element.TypeName,
        element.Type_Sorting,
        element.Workset,
        element.CCSTypeID_Type,
        element.CCSTypeID,
        element.CCSClassCode_Type,
        element.externalId,
        element.objectId,
        element.BIM7AATypeName,
        element.BIM7AATypeDescription,
        element.BIM7AATypeID,
        element.BIM7AATypeNumber,
        element.BIM7AATypeCode,
        element.BIM7AATypeComments
      );
    });
    // const request = new sql.Request();
    request.bulk(tableElt, (err, result) => {
      console.log("¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤");
      if (err) console.log(`Error ${err.message}`);
      else {
        console.log(result.rowsAffected);
      }
      console.log("¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤¤");
    });
  }
  insert();
}
module.exports = { connect, insertData };

//-----------------------------

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

function sqlElement() {
  return new Promise((resolve, reject) => {
    sql.query("SELECT * FROM project_name", function (err, result, fields) {
      if (err) throw err;

      resolve(result);
      console.log(result);
    });
  });
}

// await projects.map((project) => {
//   const request = new sql.Request();

//   request
//     .input("projectID", sql.VarChar(255), project.projectID)
//     .input("projectName", sql.VarChar(255), project.projectName)
//     .query(
//       "INSERT INTO project_name(projectID, projectName) VALUES (@projectID , @projectName)",
//       (err, result) => {
//         if (err) console.log(err);
//         console.log(result);
//       }
//     );
// });
