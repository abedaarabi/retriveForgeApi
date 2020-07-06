router.get("/hub_id", async (req, res) => {
  try {
    const response = await axios.get(`${hub}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    const hub_id = req.param("hub_id");
    const { data } = response;
    const modelData = data.data;
    // console.log(modelData.collection);

    const basicWall = modelData.collection
      .filter((e) => e.name.search("Basic Wall") !== -1)
      .map((e) => e.name);

    // const basicWallProperties = modelData.collection
    //   .filter((e) => e.name.search("Basic Wall") !== -1)
    //   .map((e) => e.properties.Phasing);

    res.send(hub_id);
    // console.log(modelData);

    // const younes = {
    //   walls: basicWall,
    // };
  } catch (err) {
    res.status(400).send(err);
    console.log(err);
  }
});

// router.get("/hubs", async (req, res) => {
//   try {
//     const response = await axios.get(`${hub}`, {
//       headers: {
//         Authorization: `Bearer ${TOKEN}`,
//       },
//     });
//     const hubs = response;
//     const moeHub_id = hubs.data.data[0].id;
//     const moeProjects = await axios.get(`${hub}/${moeHub_id}/projects`);
//     res.send(moeProjects);
//     // console.log(moeProjects);
//   } catch (error) {
//     console.log(error);
//   }
// });

// router.get("/projects", async (req, res) => {
//   const moeProjects = await axios.get(`${hub}/${moeHub_id}/projects`, {
//     headers: {
//       Authorization: `Bearer ${TOKEN}`,
//     },
//   });
//   console.log(moeProjects);
//   res.send(moeProjects);
// });

// // res.send(opject);
// const walls = opject.properties.collection.filter(
//   (e) => e.name.search("Basic Wall") !== -1
// );
// res.send(walls);
// return;
// // const basicWallProperties = properties.map((project) => {
// //   return project.collection.filter((e) => e.name.search("Basic Wall") !== -1);
// // });
// // res.send(basicWallProperties);

async function fetchFolderId(FolderId) {
  const urns = await allProjects.map(async (project) => {
    const urn = await project[1].id;
    const id = project[0];
    const urnFolder = `${forge_urn}/${id}/folders/${urn}/contents`;

    const folderIds = await axios.get(urnFolder, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    res.send({ folderIds });
  });
}

/*******************  Structure  *****************/
// const structureElement = properties.find((property) => {
//   return property.attributes.name === "LLYN.B357_K09_F2_N01.rvt";
// });

// const basicWalls = structureElement.properties.collection.filter((e) => {
//   return e.name.search("Basic Wall") !== -1;
// });
// const StructuralColumns = structureElement.properties.collection.filter(
//   (e) => {
//     return e.name.search("Structural Columns") !== -1;
//   }
// );

/*******************  El  *****************/
// const elElement = properties.find((property) => {
//   return property.attributes.name === "LLYN.B357_K07_F02_N01.rvt";
// });

// const basicWalls = elElement.properties.collection.filter((e) => {
//   return e.name.search("Basic Wall") !== -1;
// });
// const StructuralColumns = elElement.properties.collection.filter(
//   (e) => {
//     return e.name.search("Structural Columns") !== -1;
//   }
// );

/*******************  MEP  *****************/

// const mepElement = properties.find((property) => {
//   return property.attributes.name === "LLYN.B357_K08_F02_N900.rvt";
// });

/*******************  arch  *****************/

// const archElement = properties.find((property) => {
//   return property.attributes.name === "LLYN.B357_K01_F02_N01.rvt";
// });
// e.name.search("Round Duct") !== -1;
// const duct = mepElement.properties.collection.filter((e) => {
//   return e.name.search("Duct") !== -1;
// });
