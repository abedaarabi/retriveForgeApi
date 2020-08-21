const btn = document.querySelector("#btn");

document.getElementById("loan-form").addEventListener("click", function (e) {
  if (e.target.classList.contains("btn-success")) {
    document.getElementById("loading").style.display = "block";
    //fetch call new route

    // setTimeout(loading, 1000);

    e.preventDefault();
  }
});

function removeLoading(c) {
  document.getElementById(c).remove();
}

function showcomlete() {
  const node = document.createElement("div");
  node.classList = "alert alert-success";

  const textnode = document.createTextNode("Successed!");
  node.appendChild(textnode); // Append the text to <li>
  document.getElementById("myList").appendChild(node);

  // await removeElement("myList");
}

function showErr() {
  const node = document.createElement("div");
  node.classList = "alert alert-danger";

  const textnode = document.createTextNode("Error!");
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

    if (!response.ok) {
      removeLoading("loading");

      throw new Error(showErr());
    } else {
      let data = await response.json();
      console.log(data);
      removeLoading("loading");

      showcomlete();
    }
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
