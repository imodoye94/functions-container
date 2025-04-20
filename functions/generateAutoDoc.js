/* functions/generateAutoDoc.js */
const Automerge = require('@automerge/automerge');

/**
 * Expects request body { payload: { ...row fields... } }
 * Returns { doc: "<base64‑CRDT‑blob>" }
 */
module.exports = async function generateAutoDoc({ payload }) {
  // 1) Start with an empty CRDT
  let doc = Automerge.init();

  // 2) Put the entire row under a nested `payload` key
  doc = Automerge.change(doc, d => {
    d.payload = payload;
  });

  // 3) Serialize & base64‑encode
  const saved = Automerge.save(doc); // Uint8Array
  const docBase64 = Buffer.from(saved).toString('base64');
  return { doc: docBase64 };
};
