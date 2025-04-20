/* functions/mergeAutoDoc.js */

const Automerge = require('@automerge/automerge');

module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object') {
    throw new Error('Bad request body');
  }

  // 1) Load the current CRDT state
  const baseBytes = Buffer.from(existing_doc, 'base64');
  const baseDoc   = Automerge.load(baseBytes);

  // 2) Build an "update" doc containing only the changed fields
  let updateDoc = Automerge.init();
  updateDoc = Automerge.change(updateDoc, d => {
    d.payload = {};  // we only merge under payload

    for (const [flatKey, rawVal] of Object.entries(changes)) {
      // strip an RT: prefix if present
      const isRT = flatKey.startsWith('RT:');
      const path = (isRT ? flatKey.slice(3) : flatKey).split('.'); 
      let ref = d.payload;
      // navigate/create nested maps
      for (let i = 1; i < path.length - 1; i++) {
        const key = path[i];
        if (!(key in ref)) ref[key] = {};
        ref = ref[key];
      }
      const leaf = path[path.length - 1];

      if (isRT) {
        // build a fresh Text object with the whole new string
        const str = rawVal == null ? '' : String(rawVal);
        ref[leaf] = new Automerge.Text([...str]);
      } else {
        // scalar or JSONB leaf: last‑writer‑wins merge
        ref[leaf] = rawVal;
      }
    }
  });

  // 3) Merge them together
  const merged = Automerge.merge(baseDoc, updateDoc);

  // 4) Serialize & return
  const out = Buffer.from(Automerge.save(merged)).toString('base64');
  return { doc: out };
};
