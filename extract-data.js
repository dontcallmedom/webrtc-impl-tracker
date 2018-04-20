const request = require("request");
const data = require("./org.chromium.apis.web.ReleaseWebInterfaceJunction.json");

const shortname = process.argv[2];
const crawlfile  = process.argv[3]
const implfile = process.argv[4];

const fetchError = (err, qualifier) => {
  if (err) {
    console.error("Error while fetching " + qualifier +" data: " + err);
    process.exit(2);
  }
}

const idlreducer = (impldata, name) => (idlacc, member) => {
  if (member.name) {
    idlacc[member.name] = impldata.filter(d => d.targetId === name + "#" + member.name).reduce((browseracc, d) => {
      const [browsername, browserversion, os] = d.sourceId.split('_');
      if (!browseracc[browsername]) {
        browseracc[browsername] = [];
      }
      browseracc[browsername].push([browserversion, os]);
      return browseracc;
    }, {});
  }
  return idlacc;
};



if (crawlfile) {
  console.log(JSON.stringify(processCrawlData(require(crawlfile))));
} else {
  request("https://tidoust.github.io/reffy-reports/whatwg/idl/webrtc.idl", (err, res, body) => {
    fetchError(err, "spec crawl");
    console.log(JSON.stringify(processCrawlData(JSON.parse(body))));
  });
}

function processCrawlData(crawldata) {
  if (implfile) {
    return processImplData(crawldata, require(implfile));
  } else {
    request("https://storage.googleapis.com/web-api-confluence-data-cache/latest/json/org.chromium.apis.web.ReleaseWebInterfaceJunction.json", (err, res, body) => {
      fetchError(err, "api implementation");
      return processImplData(crawldata, JSON.parse(body));
    });
  }
}

function processImplData(crawldata, impldata) {
  const specData = crawldata.results.find(s => s.shortname === shortname);
  if (!specData) {
    console.error("Could not find data for a spec with shortname " + shortname);
    process.exit(2);
  }
  const interfaces = Object.keys(specData.idl.idlNames).filter(name => specData.idl.idlNames[name].type === "interface").reduce((acc, name) => {
    acc[name] = specData.idl.idlNames[name].members.reduce(idlreducer(impldata, name), {});
    return acc;
  }, {});
  Object.keys(specData.idl.idlExtendedNames).reduce((acc, name) => {
    specData.idl.idlExtendedNames[name].forEach(partial => {
      partial.members.reduce(idlreducer(impldata, name),  acc[name] || {});
    });
    return acc;
  }, interfaces);
  return interfaces;
}
