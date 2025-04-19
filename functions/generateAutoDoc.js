/* functions/generateAutoDoc.js */

const Automerge = require('@automerge/automerge');

/**
 * Given a flat JSON payload of key→value pairs,
 * build a fresh Automerge doc (or incorporate oldDoc if you later need it).
 * Returns { doc: "<base64‑encoded‑CRDT‑blob>" }.
 */
module.exports = async function generateAutoDoc(payload) {
  // 1) Start with an empty CRDT
  let doc = Automerge.init();

  // 2) Apply all fields in one change
  doc = Automerge.change(doc, d => {
    Object.assign(d, payload);
  });

  // 3) Serialize and base64‑encode
  const saved = Automerge.save(doc);                 // Uint8Array
  const docBase64 = Buffer.from(saved).toString('base64');

  return { doc: docBase64 };
};
