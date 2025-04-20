/* functions/mergeAutoDoc.js */
const Automerge            = require('@automerge/automerge');
const { diff_match_patch } = require('diff-match-patch');
const dmp                   = new diff_match_patch();

/**
 * Expects request body:
 *   {
 *     existing_doc: "<base64‑CRDT‑blob>",
 *     changes: {
 *       "RT:payload.content": "<new full string>",
 *       "payload.likes": 42,
 *       ...
 *     }
 *   }
 * Returns { doc: "<base64‑updated‑CRDT‑blob>" }
 */
module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object') {
    throw new Error('Invalid request body');
  }

  // 1) Load the old CRDT
  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  // 2) Apply all diffs in a single Automerge.change
  doc = Automerge.change(doc, d => {
    for (const [flatKey, rawVal] of Object.entries(changes)) {
      const isRT = flatKey.startsWith('RT:');         // rich‑text marker
      const path = (isRT ? flatKey.slice(3) : flatKey)
                      .split('.');                    // e.g. ['payload','content']
      let ref = d;
      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};     // create nested maps
        ref = ref[path[i]];
      }
      const leaf = path[path.length - 1];

      if (isRT) {
        // Always work with Automerge.Text
        if (!(ref[leaf] instanceof Automerge.Text)) {
          ref[leaf] = new Automerge.Text();           // start empty
        }
        const oldStr = ref[leaf].toString();
        const newStr = rawVal == null ? '' : String(rawVal);
        if (oldStr !== newStr) {
          // Compute char‑level diff and replay as splice ops
          const diffs = dmp.diff_main(oldStr, newStr);
          dmp.diff_cleanupEfficiency(diffs);
          let cursor = 0;
          for (const [op, txt] of diffs) {
            if (!txt) continue;
            if (op === diff_match_patch.DIFF_EQUAL) {
              cursor += txt.length;
            } else if (op === diff_match_patch.DIFF_DELETE) {
              ref[leaf].deleteAt(cursor, txt.length);
            } else if (op === diff_match_patch.DIFF_INSERT) {
              ref[leaf].insertAt(cursor, ...txt);
              cursor += txt.length;
            }
          }
        }
      } else {
        // Scalar fields remain last‑writer‑wins
        ref[leaf] = rawVal;
      }
    }
  });

  // 3) Return the updated blob
  const newBlob = Buffer.from(Automerge.save(doc)).toString('base64');
  return { doc: newBlob };
};
