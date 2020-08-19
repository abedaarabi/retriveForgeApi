const btn = document.querySelector("#btn");

document.getElementById("loan-form").addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-danger")) {
    document.getElementById("loading").style.display = "block";

    setTimeout(loading, 3 * 60 * 1000);

    e.preventDefault();
  }
});

async function loading() {
  document.getElementById("loading").remove();
  await showcomlete();
}

async function showcomlete() {
  const node = document.createElement("div");
  node.classList = "alert alert-success";

  const textnode = document.createTextNode("Successed!");
  node.appendChild(textnode); // Append the text to <li>
  document.getElementById("myList").appendChild(node);

  // await removeElement("myList");
}

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

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

async function removeElement(element) {
  await delay(3000);
  document.getElementById(element).remove();
}
