export default async function(shortname, browsers = ['firefox', 'chrome', 'safari']) {
  var fetch = globalThis.fetch;
  if (!fetch) {
    fetch = (await import('node-fetch')).default;
  }
  const fetchJSON = (url, options = {}) => fetch(url, options).then(r => r.json());

  const browserspecs = await fetchJSON("https://w3c.github.io/browser-specs/index.json");
  const wptruns = await fetchJSON("https://wpt.fyi/api/runs?label=master");
  const wptdata = await fetchJSON("https://wpt.fyi/api/search", {method: "post", body: `{"run_ids":${JSON.stringify(wptruns.map(r => r.id))}}`, headers: {"Content-Type": "application/json"}});
  const wptShortname = browserspecs.find(s => s.shortname === shortname || s.series.shortname === shortname)?.tests?.testPaths[0] ?? shortname;
  const idlData = (await fetchJSON("https://w3c.github.io/webref/ed/idlparsed/" + shortname + ".json")).idlparsed;
  if (!idlData.idlNames) { idlData.idlNames = {}; }
  let interfaces = {results: {}};
  // Is there an idlharness test matching this shortname?
  const testPath = wptdata.results.find(t => t.test.startsWith(`/${wptShortname}/idlharness`))?.test;
  let impldata = [];
  if (!testPath) {
    interfaces.error = `No idlharness tests found for ${shortname}`;
  } else {
    // Fetch results for the said test
    impldata = await Promise.all(
      wptdata.runs
        .filter(r => browsers.includes(r.browser_name))
      // FIXME: URL hacking
        .map(async (r) =>  {
          const url = r.raw_results_url.replace('/wptd-results/', '/wptd/')
                .replace("/report.json", testPath);
          return {browser: {name: r.browser_name, version: r.browser_version}, results: await fetchJSON(url)};
        })
    );
  }
  // gathering information on full and partial interfaces
  const interfaceNames = Object.keys(idlData.idlNames).filter(name => idlData.idlNames[name].type === "interface").concat(
    Object.keys(idlData.idlExtendedNames).filter(name => idlData.idlExtendedNames[name][0].type === "interface")
  );
  if (!interfaceNames.length) {
    interfaces.error = `No interfaces found in ${shortname}`;
  }
  for (let interfaceName of interfaceNames) {
    if (!interfaces.results[interfaceName]) {
      interfaces.results[interfaceName] = {};
    }
    const interfaceList = [idlData.idlNames[interfaceName]].concat(idlData.idlExtendedNames[interfaceName] ?? []).filter(x => x);
    let interfaceIsTested = false;
    for (let iface of interfaceList) {
      if (!iface.partial) {
        // interface existence
        interfaces.results[interfaceName].__interface = {};
        for (let {browser, results} of impldata) {
          let res = results.subtests.find(t => t.name === `${interfaceName} interface: existence and properties of interface object`);
          if (res) {
            interfaceIsTested = true;
            interfaces.results[interfaceName].__interface[browser.name] = res.status;
          } else {
            interfaces.results[interfaceName].__interface[browser.name] = "N/A";
          }
        }
      } else {
        // only check if the (partial) interface is included in the test
        if (impldata.length) {
          let {browser, results} = impldata[0];
          interfaceIsTested = results.subtests.find(t => t.name === `Partial interface ${interfaceName}: original interface defined`);
        }
      }
      // TODO: interface constructors?
      // interface members
      for (let member of (iface.members || []).filter(m => m.name)) {
        interfaces.results[interfaceName][member.name] = {};
        for (let {browser, results} of impldata) {
          let res = results.subtests.find(t => t.name.startsWith(`${interfaceName} interface: ${member.type} ${member.name}`));
          interfaces.results[interfaceName][member.name][browser.name] = res?.status || "N/A";
        }
      }
    }
  }
  return interfaces;
}
