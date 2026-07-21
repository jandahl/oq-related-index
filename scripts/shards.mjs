const LETTERS = /[\p{L}\p{N}]/u;

/** Return a stable, filesystem-safe shard key for a record headword. */
export function shardKey(headword) {
  const first = String(headword ?? "").normalize("NFKC").trim().toLocaleLowerCase("kl").charAt(0);
  return LETTERS.test(first) ? first : "_";
}

/** Group complete records by their normalized first character. */
export function groupRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = shardKey(record.headword);
    const group = groups.get(key) ?? [];
    group.push(record);
    groups.set(key, group);
  }
  return groups;
}

/** Add the target shard to each relation so clients can lazy-load it. */
export function addRelationShards(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  return records.map((record) => ({
    ...record,
    related: record.related?.map((relation) => ({
      ...relation,
      shard: shardKey(byId.get(relation.id)?.headword),
    })),
  }));
}

export function shardManifest(groups) {
  return Object.fromEntries([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, records]) => [key, {
    url: `records/${encodeURIComponent(key)}.json`,
    records: records.length,
  }]));
}
