const parser = require("./parser");
const admin = require("firebase-admin");
const fs = require("fs");
const cmdArgs = require("command-line-args");
const cmdUsage = require("command-line-usage");

const usageDef = [
  {
    header: "Cli app for parsing trio files and save them to a remote db",
    content: ""
  },
  {
    header: "Options",
    optionList: [
      {
        name: "verbose",
        alias: "v",
        description: "Display verbose messages."
      },
      {
        name: "keyfile",
        alias: "k",
        typeLabel: "{underline file}",
        description: "Account Service json file used to authenticate with the firestore."
      },

      {
        name: "tagsdir",
        alias: "d",
        typeLabel: "{underline path}",
        description: "a directory where the .trio files are stored."
      },
      {
        name: "help",
        alias: "h",
        description: "Print this usage guide."
      }
    ]
  }
];
const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  { name: "help", alias: "h", type: Boolean },
  { name: "keyfile", alias: "k", type: String, defaultOption: true },
  { name: "tagsdir", alias: "t", type: String },
  { name: "dictionary", alias: "d", type: String }
];

const usage = cmdUsage(usageDef);
let options;
try {
  options = cmdArgs(optionDefinitions);
} catch (error) {
  console.log(error.message);
  console.log(usage);
  process.exit(1);
}

if (options.help) {
  console.log(usage);
  process.exit(0);
}

const verbose = options.verbose;
const tagsDir = options.tagsdir;
const accountServiceFile = options.keyfile;
const dictionary = options.dictionary ? options.dictionary.toLowerCase() : "haystack";

if (!tagsDir) {
  console.log("option --tagsdir or -d is required");
  console.log(usage);
  process.exit(1);
}

if (!accountServiceFile) {
  console.log("option --keyfile or -k is required");
  console.log(usage);
  process.exit(1);
}

// init firestore
const serviceAccount = require("./" + accountServiceFile);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hso-project.firebaseio.com"
});
const db = admin.firestore();

fs.readdir(tagsDir, (err, files) => {
  if (err) {
    console.log(err.message);
    return;
  }
  for (const file of files) {
    const indexOfExtention = file.lastIndexOf(".");
    let filename;
    if (indexOfExtention === -1) {
      filename = file;
    } else {
      filename = file.slice(0, indexOfExtention);
    }
    if (verbose) {
      console.log("Parsing file : " + file);
    }
    const data = parser(tagsDir + "/" + file).parse();
    data.forEach(e => {
      let tag = {
        category: filename,
        dictionary: dictionary,
        kind: e.kind ? e.kind : null,
        usedWith: e.usedWith ? e.usedWith : null,
        alsoSee: e.alsoSee ? e.alsoSee : null,
        description: e.doc ? e.doc : null
      };

      const tagRef = db.collection("tag").doc(e.tag);
      saveDoc(tagRef, tag)(err => {
        console.log("Error getting document", err);
      });
    });
    if (verbose) {
      console.log("File " + file + " saved to filestore! ");
    }
  }
});
function saveDoc(tagRef, tag) {
  return tagRef.get().then(doc => {
    if (!doc.exists) {
      tagRef.set(tag);
    } else {
      tagRef.update(tag);
    }
  }).catch;
}
