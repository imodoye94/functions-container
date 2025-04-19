/* functions/mergeAutoDoc.js */

const Automerge = require('automerge');

/**
 * Expects { doc1, doc2 } where each is a base64 string
 * Returns { doc: "<base64‑encoded‑merged‑blob>" }
 */
module.exports = async function mergeAutoDoc({ doc1, doc2 }) {
  if (typeof doc1 !== 'string' || typeof doc2 !== 'string') {
    throw new Error('Missing or invalid doc1/doc2 in request body');
  }

  // 1) Decode base64 → Uint8Array
  const bytes1 = Buffer.from(doc1, 'base64');
  const bytes2 = Buffer.from(doc2, 'base64');

  // 2) Rehydrate Automerge documents
  const a = Automerge.load(bytes1);
  const b = Automerge.load(bytes2);

  // 3) Merge & serialize
  const merged = Automerge.merge(a, b);
  const saved  = Automerge.save(merged);
  const mergedBase64 = Buffer.from(saved).toString('base64');

  return { doc: mergedBase64 };
};
