/* functions/mergeAutoDoc.js */

const Automerge            = require('@automerge/automerge');
const { diff_match_patch } = require('diff-match-patch');
const dmp                   = new diff_match_patch();

/**
 * POST body: { existing_doc: <b64>, changes: { ... } }
 */
module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object')
    throw new Error('Bad body');
  
  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  console.log(changes);

  doc = Automerge.change(doc, d => {
    for (const [k, v] of Object.entries(changes)) {
      const isRT = k.startsWith('RT:');
      const key  = isRT ? k.slice(3) : k;        // real column name
      const path = key.split('.');
      let ref = d;
      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};
        ref = ref[path[i]];
      }
      const leaf = path[path.length - 1];

      /* ---------- rich‑text column ---------- */
      if (isRT) {
        const newStr = (v ?? '').toString();
        if (!(ref[leaf] instanceof Automerge.Text)) {
          ref[leaf] = new Automerge.Text(newStr);
          continue;
        }

        /* diff old vs new and convert to splices */
        const oldStr = ref[leaf].toString();
        if (oldStr === newStr) continue;         // no actual change

        const diffs = dmp.diff_main(oldStr, newStr);
        dmp.diff_cleanupEfficiency(diffs);

        let cursor = 0;
        for (const [op, text] of diffs) {
          if (!text) continue;
          if (op === 0) {                        // EQUAL
            cursor += text.length;
          } else if (op === -1) {                // DELETE
            ref[leaf].deleteAt(cursor, text.length);
          } else if (op === 1) {                 // INSERT
            ref[leaf].insertAt(cursor, ...text);
            cursor += text.length;
          }
        }
      }

      /* ---------- scalar column ---------- */
      else {
        ref[leaf] = v;
      }
    }
  });

  return { doc: Buffer.from(Automerge.save(doc)).toString('base64') };
};
