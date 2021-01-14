// **********************TRANSLATION*************************** */
await Promise.all(
  originalItemUrns.map(([projectId, originalItemUrn]) =>
    publishModel(projectId, originalItemUrn)
  )
);

// make sure all projects been translated
let allStatus;

while (!allStatus) {
  console.log("waiting for Translation to start");
  await delay(10000);
  const translatesStatus = await Promise.all(
    originalItemUrns.map(([projectId, originalItemUrn]) => {
      // console.log("testfgsdjhgdas", projectId, originalItemUrn);
      return getPublishModelJob(projectId, originalItemUrn)
        .then((response) => response.data.data)
        .catch((err) => {
          console.log(err);
          return [];
        });
    })
  );

  // translateStatus.push({ attributes: { status: "notyet" } });

  allStatus = translatesStatus.every((data) => {
    console.log(data);
    if (!data || !data.attributes) return false;
    // else if (data == null) console.log("Model Needs Publishing ");
    return data.attributes.status === "complete";
  });
  console.log(allStatus);
}

// ****************** make sure all projects been translated
let allItemStatus;

while (!allItemStatus) {
  console.log("waiting for Translation to complete");
  await delay(10000);
  const translatesStatus = await Promise.all(
    originalItemUrns.map(([projectId, originalItemUrn]) => {
      // console.log("testfgsdjhgdas", projectId, originalItemUrn);
      return translationStatus(projectId, originalItemUrn)
        .then(
          (response) =>
            response.data.included[0].attributes.extension.data.processState
        )

        .catch((err) => {
          console.log(err);
          return [];
        });
    })
  );

  // translateStatus.push({ attributes: { status: "notyet" } });

  allItemStatus = translatesStatus.every((data) => {
    return data === "PROCESSING_COMPLETE";
  });

  console.log(allItemStatus);
}
res.send(allStatus);
return;
