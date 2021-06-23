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
    idleTimeoutMillis: 1500000,
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
  const promises = modiId.map((id) => {
    return sql.query(`DELETE FROM element WHERE objectId LIKE '%${id}%'`);
  });
  const res = await Promise.all(promises);

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
    projects.map((project) => {
      tablePro.rows.add(project.projectID, project.projectName);
    });
    try {
      const result = await request.bulk(tablePro);
      console.log(result);
    } catch (error) {
      console.log("project error", error);
    }

    //items

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
    items.map((object) => {
      tableItem.rows.add(
        object.date,
        object.elementsCount,
        object.id,
        object.name,
        object.projectId
      );
    });

    try {
      const result = await request.bulk(tableItem);
      console.log(result);
    } catch (err) {
      console.log(`items error ${err.message}`);
    }
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

    elements.forEach((element) => {
      tableElt.rows.add(
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

    let result;
    try {
      result = await request.bulk(tableElt);
      console.log(result);
    } catch (error) {
      console.log("table element error", error);
    }
    return result;
  }

  const result = await insert();

  return { deleted: res, elements: result };
}
module.exports = { connect, insertData };

//-----------------------------

async function awsome(param) {
  try {
    const result = await request.bulk(param);
    return result;
  } catch (err) {
    console.log(`items error ${err.message}`);
  }
}
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
