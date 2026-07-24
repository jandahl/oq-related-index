const asArray = (value) => Array.isArray(value) ? value : [];

export const RELATEDNESS_POLICY = Object.freeze({
  algorithm: "bounded-signal-v2",
  limit: 8,
  minimumSignalScore: 2,
  minimumReasons: 2,
  reciprocalBonus: 3,
  sharedNeighbourCap: 1.5,
  sharedNeighbourDiscount: "inverse-log-degree",
  semanticClassBase: 6,
  semanticClassFloor: 0.5,
});

const tokens = (values) => new Set(asArray(values).flatMap((value) =>
  String(value ?? "").toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu) ?? []));

function addCandidate(groups, id, reason, weight, meaningful = true) {
  if (!id) return;
  const candidate = groups.get(id) ?? { id, score: 0, signalScore: 0, reasons: [] };
  candidate.score += weight;
  if (meaningful) candidate.signalScore += weight;
  if (!candidate.reasons.includes(reason)) candidate.reasons.push(reason);
  groups.set(id, candidate);
}

/** Score one record against the published inverted indexes. */
export function scoreRelated(record, indexes) {
  const groups = new Map();
  for (const classId of asArray(record.semantic_classes)) {
    const ids = asArray(indexes.bySemanticClass?.[classId]);
    const weight = Math.max(
      RELATEDNESS_POLICY.semanticClassFloor,
      RELATEDNESS_POLICY.semanticClassBase - Math.log2(Math.max(1, ids.length)),
    );
    for (const id of ids) addCandidate(groups, id, "same semantic class", weight);
  }
  if (record.domain?.id) {
    const ids = asArray(indexes.byDomain?.[record.domain.id]);
    const weight = Math.max(0.5, 3 - Math.log2(Math.max(1, ids.length)));
    for (const id of ids) addCandidate(groups, id, "same domain", weight);
  }
  if (record.word_class) {
    for (const candidate of groups.values()) {
      const target = indexes.recordsById?.get(candidate.id);
      if (target?.word_class === record.word_class) addCandidate(groups, candidate.id, "same word class", 1, false);
    }
  }
  for (const token of tokens([...asArray(record.gloss_en), ...asArray(record.gloss_da)])) {
    const ids = asArray(indexes.byGlossToken?.[token]);
    const weight = Math.max(0.5, 3 - Math.log2(Math.max(1, ids.length)));
    for (const id of ids) addCandidate(groups, id, "shared gloss", weight);
  }
  groups.delete(record.id);
  return groups;
}

/** Compile bounded, explainable relatedness with a reciprocal-support signal. */
export function compileRelatedness(records, indexes, {
  limit = RELATEDNESS_POLICY.limit,
  minimumReasons = RELATEDNESS_POLICY.minimumReasons,
} = {}) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const scoreIndexes = { ...indexes, recordsById: byId };
  const directById = new Map(records.map((record) => {
    const direct = [...scoreRelated(record, scoreIndexes).values()]
      .filter((candidate) => candidate.signalScore >= RELATEDNESS_POLICY.minimumSignalScore)
      .sort((a, b) => b.signalScore - a.signalScore || b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, limit * 2);
    return [record.id, direct];
  }));
  const neighbours = new Map([...directById].map(([id, candidates]) => [
    id, new Set(candidates.map((candidate) => candidate.id)),
  ]));
  const sharedNeighbourWeight = (left, right) => {
    const common = [...(neighbours.get(left) ?? [])]
      .filter((id) => neighbours.get(right)?.has(id));
    const score = common.reduce((total, id) => {
      const degree = neighbours.get(id)?.size ?? 0;
      return total + 1 / Math.log2(Math.max(2, degree + 1));
    }, 0);
    return Math.min(RELATEDNESS_POLICY.sharedNeighbourCap, score);
  };
  return records.map((record) => {
    const direct = directById.get(record.id) ?? [];
    const related = direct.map((candidate) => {
      const reverse = scoreRelated(byId.get(candidate.id), scoreIndexes).get(record.id);
      const reciprocal = reverse?.signalScore >= RELATEDNESS_POLICY.minimumSignalScore;
      if (reciprocal) {
        candidate.score += 3;
        candidate.reasons.push("reciprocal relatedness");
      }
      const sharedWeight = sharedNeighbourWeight(record.id, candidate.id);
      if (sharedWeight > 0) {
        candidate.score += sharedWeight;
        candidate.reasons.push("shared related words");
      }
      const independentReasons = candidate.reasons.filter((reason) =>
        reason !== "same word class" && reason !== "reciprocal relatedness").length;
      if (independentReasons < minimumReasons) return null;
      const { signalScore, ...published } = candidate;
      return { ...published, headword: byId.get(candidate.id)?.headword ?? "" };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
    return { ...record, related };
  });
}
