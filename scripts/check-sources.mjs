import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const sources = {
  lexicon: "https://jandahl.github.io/Oqaasileriffik-katersat/lexicon.json",
  semantic_classes: "https://jandahl.github.io/Oqaasileriffik-katersat/semantic_classes.json",
};

const checksums = {};
for (const [name, url] of Object.entries(sources)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source fetch failed: ${url} (${response.status})`);
  checksums[name] = createHash("sha256").update(Buffer.from(await response.arrayBuffer())).digest("hex");
}

let previous = {};
try {
  const index = JSON.parse(await readFile("docs/related-index.json", "utf8"));
  previous = index.meta?.source_checksums ?? {};
} catch {
  // A missing or malformed artifact is a reason to rebuild.
}

console.log(`changed=${String(Object.entries(checksums).some(([name, hash]) => previous[name] !== hash))}`);
for (const [name, hash] of Object.entries(checksums)) console.log(`${name}=${hash}`);
