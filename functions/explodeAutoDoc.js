/* functions/explodeAutoDoc.js */

const Automerge = require('automerge');

/**
 * Expects { doc } where doc is a base64‑encoded CRDT blob.
 * Returns:
 *   {
 *     json_data: { …exploded key→value map… },
 *     doc:       "<same base64 string>"
 *   }
 */
module.exports = async function explodeAutoDoc({ doc }) {
  if (typeof doc !== 'string') {
    throw new Error('Missing or invalid doc (base64) in request body');
  }

  // 1) Decode & load
  const bytes = Buffer.from(doc, 'base64');
  const d = Automerge.load(bytes);

  // 2) toJS gives us the full merged object
  const jsonData = Automerge.toJS(d);

  // 3) Return both the exploded data and the original doc
  return {
    json_data: jsonData,
    doc
  };
};
