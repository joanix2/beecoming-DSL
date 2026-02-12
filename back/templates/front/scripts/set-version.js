const fs = require("fs");

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = packageJson.version;

const today = new Date();
const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

const versionTsContent = `export const APP_VERSION = '${version}';`;
const dateTsContent = `export const APP_DATE = '${formattedDate}';`;

fs.writeFileSync("src/environments/version.ts", versionTsContent, "utf8");
fs.appendFileSync("src/environments/version.ts", "\n", "utf8");
fs.appendFileSync("src/environments/version.ts", dateTsContent, "utf8");
