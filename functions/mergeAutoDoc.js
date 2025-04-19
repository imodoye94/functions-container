/* functions/mergeAutoDoc.js */

const Automerge              = require('@automerge/automerge');
const { diff_match_patch }   = require('diff-match-patch');
const dmp                     = new diff_match_patch();

/**
 * Body: { existing_doc:<b64>, changes:{...} }
 * Rich‑text columns arrive with KEYS that begin "RT:".
 */
module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object') {
    throw new Error('Bad request body');
  }

  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  doc = Automerge.change(doc, d => {
    for (const [flatKey, val] of Object.entries(changes)) {

      /* ───────── detect rich‑text by key prefix ───────── */
      const isRT   = flatKey.startsWith('RT:');
      const path   = (isRT ? flatKey.slice(3) : flatKey).split('.');
      let   ref    = d;

      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};
        ref = ref[path[i]];
      }
      const leaf = path[path.length - 1];

      /* ───────── rich‑text merge via splice ops ───────── */
      if (isRT) {
        const newStr = (val ?? '').toString();         // coerce null → ''
        if (!(ref[leaf] instanceof Automerge.Text)) {
          ref[leaf] = new Automerge.Text();
          ref[leaf].insertAt(0, ...newStr);
        } else {
          const oldStr  = ref[leaf].toString();
          if (oldStr !== newStr) {
            const patches = dmp.patch_make(oldStr, newStr);
            let cursor = 0;
            patches.forEach(patch => {
              patch.diffs.forEach(([op, text]) => {
                if (op === diff_match_patch.DIFF_EQUAL) {
                  cursor += text.length;
                } else if (op === diff_match_patch.DIFF_DELETE) {
                  ref[leaf].deleteAt(cursor, text.length);
                } else if (op === diff_match_patch.DIFF_INSERT) {
                  ref[leaf].insertAt(cursor, ...text);
                  cursor += text.length;
                }
              });
            });
          }
        }
      }

      /* ───────── plain scalar (LWW) ───────── */
      else {
        ref[leaf] = val;
      }
    }
  });

  return { doc: Buffer.from(Automerge.save(doc)).toString('base64') };
};
