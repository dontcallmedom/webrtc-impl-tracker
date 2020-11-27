const fetch = require("node-fetch");
const fs = require("fs").promises;

const shortnames = require("./specs.json");
const browsers = ['firefox', 'chrome', 'safari'];

const idlreducer = (impldata, name) => (idlacc, member) => {
  if (member.name) {
    const browserdata = impldata.array.find(d => d.id === name + "#" + member.name);
    if (!browserdata) {
      idlacc[member.name] = null;
      return idlacc;
    }
    idlacc[member.name] = Object.keys(browserdata)
      .filter(k => browsers.some(b => k.startsWith(b))).reduce((browseracc, browserkey) => {
        const browserentry = browserdata[browserkey];
        const [browser,] = browserkey.split('_');
        const [, browsername, browserversion] = browser.match(/([^0-9]*)([0-9]*)/)
        if (!browseracc[browsername]) {
          browseracc[browsername] = [];
        }
        browseracc[browsername].push(browserversion);
        return browseracc;
      }, {})
  }
  return idlacc;
};


(async function(shortnames) {
  const impldata = await fetch("https://web-confluence.appspot.com/compatDAO:select", {method: "post", body: "{}", headers: {"Content-Type": "application/json"}}).then(r => r.json());
  shortnames.forEach(async (shortname) =>  {
    const specData = await fetch("https://w3c.github.io/webref/ed/idlparsed/" + shortname + ".json").then(r => r.json());
    const interfaces = Object.keys(specData.idlparsed.idlNames).filter(name => specData.idlparsed.idlNames[name].type === "interface").reduce((acc, name) => {
      acc[name] = specData.idlparsed.idlNames[name].members.reduce(idlreducer(impldata, name), {});
      return acc;
    }, {});
    Object.keys(specData.idlparsed.idlExtendedNames).reduce((acc, name) => {
      specData.idlparsed.idlExtendedNames[name].filter(i => i.type=== "interface").forEach(partial => {
        acc[name] = partial.members.reduce(idlreducer(impldata, name),  acc[name] || {});
        return acc;
      });
      return acc;
                     }, interfaces);
    await fs.writeFile(shortname + ".json", JSON.stringify( interfaces, null, 2));
  });
})(shortnames);
