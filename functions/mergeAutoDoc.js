const Automerge            = require('@automerge/automerge');
const { diff_match_patch } = require('diff-match-patch');
const dmp                   = new diff_match_patch();

module.exports = async function mergeAutoDoc({ existing_doc, changes }) {
  if (typeof existing_doc !== 'string' || typeof changes !== 'object')
    throw new Error('Bad body');

  let doc = Automerge.load(Buffer.from(existing_doc, 'base64'));

  doc = Automerge.change(doc, d => {
    for (const [k, v] of Object.entries(changes)) {

      /* ── detect rich‑text by key ── */
      const isRT = k.startsWith('RT:');
      const flat = isRT ? k.slice(3) : k;            // strip RT:
      const path = flat.split('.');
      let   ref  = d;                                // navigate/create

      for (let i = 0; i < path.length - 1; i++) {
        if (!(path[i] in ref)) ref[path[i]] = {};
        ref = ref[path[i]];
      }
      const leaf = path[path.length - 1];

      /* ── rich‑text splice merge ── */
      if (isRT) {
        const newStr = (v ?? '').toString();
        if (!(ref[leaf] instanceof Automerge.Text)) {
          ref[leaf] = new Automerge.Text(newStr);
        } else if (ref[leaf].toString() !== newStr) {
          const diffs = dmp.diff_main(ref[leaf].toString(), newStr);
          dmp.diff_cleanupEfficiency(diffs);

          let cursor = 0;
          for (const [op, txt] of diffs) {
            if (!txt) continue;
            if (op === 0) cursor += txt.length;          // equal
            if (op === -1) ref[leaf].deleteAt(cursor, txt.length);
            if (op === 1)  { ref[leaf].insertAt(cursor, ...txt); cursor += txt.length; }
          }
        }

        /* clean up any accidental duplicate top‑level key */
        if (flat.startsWith('payload.') && d.content !== undefined) {
          delete d.content;
        }
        continue;
      }

      /* ── scalar LWW ── */
      ref[leaf] = v;
    }
  });

  return { doc: Buffer.from(Automerge.save(doc)).toString('base64') };
};
