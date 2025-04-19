/* functions/mergeAutoDoc.js */

const Automerge = require('@automerge/automerge');

/**
 * Expects:
 *   { existing_doc: "<base64>", changes: { "a.b": 42, ... } }
 * Returns:
 *   { doc: "<base64‑updated>" }
 */
module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object') {
    throw new Error('Bad request body: need existing_doc (b64) & changes (obj)');
  }

  // 1) Load the current Automerge document
  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  // 2) Apply each flattened key
  doc = Automerge.change(doc, d => {
    for (const [flatKey, value] of Object.entries(changes)) {
      const path = flatKey.split('.');
      let ref = d;
      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};      // make intermediate maps
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;              // set leaf
    }
  });

  // 3) Serialize → base64
  return { doc: Buffer.from(Automerge.save(doc)).toString('base64') };
};
