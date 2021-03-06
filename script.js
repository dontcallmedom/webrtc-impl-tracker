let shortname = location.search.slice(1);

if (!shortname) {
  shortname = "webrtc";
}
showSpec(shortname);
const tbody = document.querySelector("tbody");

const markupBrowserSupport = (td, data) => {
  td.className = data ? "yes" : "no";
  // This is probably too simple
  if (data)
    td.textContent = data[0] + "+";
};

function showSpec(shortname) {
  fetch(shortname + ".json")
    .then(r => r.json())
    .then(d => {
      Object.keys(d).forEach(name => {
        const tr = document.createElement("tr");

        const th = document.createElement("th");
        th.setAttribute("rowspan", Object.keys(d[name]).length);
        th.textContent = name;
        th.scope = "row";
        tr.appendChild(th);
        let container = tr;
        Object.keys(d[name]).forEach(member => {
          const memberTd = document.createElement("td");
          const chromeTd = document.createElement("td");
          const firefoxTd = document.createElement("td");
          const safariTd = document.createElement("td");

          const nameSpan = document.createElement("span");
          const scoreSpan = document.createElement("span");
          scoreSpan.className = "score";
          nameSpan.textContent = member + " ";
          if (!d[name][member]) {
          scoreSpan.textContent = "?/3";
            memberTd.className = "unknown";
          } else {
            scoreSpan.textContent = Object.keys(d[name][member]).length + "/3";
            memberTd.className = Object.keys(d[name][member]).length >= 2 ? "yes" + Object.keys(d[name][member]).length : "no" + (3 - Object.keys(d[name][member]).length);
            markupBrowserSupport(chromeTd, d[name][member].chrome);
            markupBrowserSupport(firefoxTd, d[name][member].firefox);
            markupBrowserSupport(safariTd, d[name][member].safari);
          }

          memberTd.appendChild(nameSpan);
          memberTd.appendChild(scoreSpan);
          container.appendChild(memberTd);
          container.appendChild(chromeTd);
          container.appendChild(firefoxTd);
          container.appendChild(safariTd);
          tbody.appendChild(container);
          container = document.createElement("tr");
        });
      });
    })
    .catch(err => console.error(err));
}

fetch("specs.json").then(r => r.json()).then(shortnames =>{
  const selector = document.getElementById("spec");
  for (let s of shortnames) {
    const opt = document.createElement("option");
    opt.textContent = s;
    if (s === shortname) {
      opt.selected = true;
    }
    selector.appendChild(opt);
  }
  selector.addEventListener("change", () => {
    tbody.innerHTML = "";
    showSpec(selector.value);
  });
});
