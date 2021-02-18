const btn = document.getElementById("btn");
const input = document.getElementById("project");

let objects;

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

// function showcomlete() {
//   const node = document.createElement("div");
//   node.classList = "alert alert-success";

//   const textnode = document.createTextNode(
//     "Successed! \n Data Inserted in to MOE Database."
//   );
//   node.appendChild(textnode); // Append the text to <li>
//   document.getElementById("myList").appendChild(node);

//   // await removeElement("myList");
// }

// function showErr() {
//   const node = document.createElement("div");
//   node.classList = "alert alert-danger";

//   const textnode = document.createTextNode("Error!");
//   node.appendChild(textnode); // Append the text to <li>
//   document.getElementById("myList").appendChild(node);

//   // await removeElement("myList");
// }

btn.addEventListener("click", async (e) => {
  e.preventDefault();
  // try {
  //   let response = await fetch("/hubs", {
  //     method: "get",
  //     body: JSON.stringify(),
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });

  //   if (!response.ok) {
  //     removeLoading("loading");

  //     throw new Error(showErr());
  //   } else {
  //     let data = await response.json();
  //     console.log(data);
  //     removeLoading("loading");

  //     showcomlete();
  //   }
  // } catch (err) {
  //   console.log(err);
  // }

  const chekedCheckBoxes = document.querySelectorAll(
    "input[type=checkbox]:checked"
  );
  const ids = Array.from(chekedCheckBoxes).map(
    (checkbox) => checkbox.parentElement.dataset.id
  );

  const selectedObjects = objects
    .filter((object) => {
      return ids.includes(object.derivativeId);
    })
    .map((object) => object.payload);
  // console.log(selectedObjects);

  const response = await (
    await fetch(`/metadata`, {
      method: "post",
      body: JSON.stringify(selectedObjects),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => console.log(err))
  ).json();
  console.log(response);
});

input.addEventListener("keyup", async function fetchProject(e) {
  const value = e.target.value;
  console.log("start", value);
  if (!value) {
    document.getElementById("projectList").innerHTML = "";
  } else {
    const response = await (
      await fetch(`/projects?q=${value}`).catch((err) => console.log(err))
    ).json();

    objects = response;
    // console.log(response);
    let output;
    response.map((object) => {
      output += `<li  
                data-id=${object.derivativeId}>
                  <input
                    type="checkbox"
                    
                  ></input>
                  ${object.name}
        </li>`;
      document.getElementById("projectList").innerHTML = output;
    });
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
