const shortname = location.search.slice(1);
const tbody = document.querySelector("tbody");

const markupBrowserSupport = (td, data) => {
  td.className = data ? "yes" : "no";
  // This is probably too simple
  if (data)
    td.textContent = data[0][0] + "+";
};

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
        const edgeTd = document.createElement("td");
        const firefoxTd = document.createElement("td");
        const safariTd = document.createElement("td");

        memberTd.textContent = member;

        memberTd.className = Object.keys(d[name][member]).length >= 2 ? "yes" + Object.keys(d[name][member]).length : "no" + (4 - Object.keys(d[name][member]).length);
        markupBrowserSupport(chromeTd, d[name][member].Chrome);
        markupBrowserSupport(edgeTd, d[name][member].Edge);
        markupBrowserSupport(firefoxTd, d[name][member].Firefox);
        markupBrowserSupport(safariTd, d[name][member].Safari);

        container.appendChild(memberTd);
        container.appendChild(chromeTd);
        container.appendChild(edgeTd);
        container.appendChild(firefoxTd);
        container.appendChild(safariTd);
        tbody.appendChild(container);
        container = document.createElement("tr");
      });
    });
  })
  .catch(err => console.error(err));
