import fetchIdlImplData from './lib/fetch-idl-implementation-data.mjs';

let selectedShortname = location.search.slice(1);

if (!selectedShortname) {
  selectedShortname = "webrtc";
}
showSpec(selectedShortname);
const tbody = document.querySelector("tbody");

const markupBrowserSupport = (td, data) => {
  if (data === "PASS") {
    td.className = "yes";
    td.textContent = "y";
  } else if (data === "FAIL") {
    td.className = "no";
    td.textContent = "n";
  } else {
    td.textContent = "N/A";
  }
};

function showError(err) {
  const errLog = document.createElement("div");
  errLog.id = "errorlog";
  errLog.textContent = err;
  document.body.appendChild(errLog);
}

function showSpec(shortname) {
  fetchIdlImplData(shortname)
    .then(({results: d, error: err}) => {
      if (document.getElementById("errorlog")) {
          document.getElementById("errorlog").remove();
      }
      if (err) {
        showError(err);
      }
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
            const scorePass = Object.values(d[name][member]).filter(x => x === "PASS").length;
            const scoreFail = Object.values(d[name][member]).filter(x => x === "FAIL").length;
            scoreSpan.textContent = (scorePass + scoreFail === 3) ? scorePass + "/3" : " (N/A)";
            memberTd.className = scorePass >= 2 ? "yes" + scorePass : "no" + scoreFail;
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
    .catch(err => showError(err.message));
}

const selector = document.getElementById("spec");

fetch("https://w3c.github.io/webref/ed/index.json").then(r => r.json()).then(({results: specs}) => {
  specs.filter(s => s.idlparsed).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.shortname;
    opt.textContent = s.shortTitle;
    if (s.shortname === selectedShortname) {
      opt.selected = true;
    }
    selector.appendChild(opt);
  });
  selector.addEventListener("change", () => {
    tbody.innerHTML = "";
    showSpec(selector.value);
  });
});
