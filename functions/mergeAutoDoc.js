/* functions/mergeAutoDoc.js */

const Automerge              = require('@automerge/automerge');
const { diff_match_patch }   = require('diff-match-patch');
const dmp                     = new diff_match_patch();

/**
 * Body: { existing_doc:<b64>, changes:{...} }
 * Recognises values that start with "RT:" as rich‑text fields.
 */
module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  doc = Automerge.change(doc, d => {
    for (const [flatKey, rawVal] of Object.entries(changes)) {
      const isRT = typeof rawVal === 'string' && rawVal.startsWith('RT:');
      const val  = isRT ? rawVal.slice(3) : rawVal;              // strip prefix
      const path = flatKey.split('.');
      let ref = d;
      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};
        ref = ref[path[i]];
      }
      const leaf = path[path.length - 1];

      if (isRT) {
        /* ----- rich‑text merge via splice ops ----- */
        if (!(ref[leaf] instanceof Automerge.Text)) {
          // First time we see this column → seed it
          ref[leaf] = new Automerge.Text();
          ref[leaf].insertAt(0, ...val);
        } else {
          const oldStr = ref[leaf].toString();
          const patches = dmp.patch_make(oldStr, val);
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
      } else {
        /* ----- scalar key: simple assignment (LWW) ----- */
        ref[leaf] = val;
      }
    }
  });

  return { doc: Buffer.from(Automerge.save(doc)).toString('base64') };
};
