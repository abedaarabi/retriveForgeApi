const btn = document.querySelector("#btn");

btn.addEventListener("click", async (e) => {
  // e.preventDefault();
  try {
    let response = await fetch("/hubs", {
      method: "get",
      body: JSON.stringify(),
      headers: {
        "Content-Type": "application/json",
      },
    });
    let data = await response.json();
    console.log(data);
  } catch (err) {
    console.log(err);
  }
});
