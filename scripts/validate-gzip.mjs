import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";

const jsonFile = "docs/related-index.json";
const gzipFile = `${jsonFile}.gz`;
const json = await readFile(jsonFile);
const decoded = gunzipSync(await readFile(gzipFile));
if (!decoded.equals(json)) {
  console.error(`${gzipFile}: decompressed content differs from ${jsonFile}`);
  process.exit(1);
}
console.log(`Validated gzip artifact: ${gzipFile}`);
