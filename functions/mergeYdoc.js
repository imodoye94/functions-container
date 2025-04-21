const Y = require('yjs');

/**
 * Handler for POST /mergeYdoc
 * Expects JSON body: { id: string, patch: Record<string, any>, currentBase64?: string }
 * Returns: { mergedBase64: string }
 */
module.exports = async function mergeYdocHandler(req, res) {
  try {
    const { id, patch, currentBase64 } = req.body;
    if (typeof id !== 'string' || typeof patch !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid id/patch' });
    }

    // 1) Initialize or load existing Y.Doc
    const doc = new Y.Doc();
    if (currentBase64) {
      const update = Buffer.from(currentBase64, 'base64');
      Y.applyUpdate(doc, update);
    }

    // 2) Apply the incoming patch to the "fields" map
    const map = doc.getMap('fields');
    for (const [key, value] of Object.entries(patch)) {
      map.set(key, value);
    }

    // 3) Encode the merged state as a Base64 string
    const mergedUpdate = Y.encodeStateAsUpdate(doc);
    const mergedBase64 = Buffer.from(mergedUpdate).toString('base64');

    // 4) Send back the merged Base64 document
    res.json({ mergedBase64 });
  } catch (err) {
    console.error('mergeYdoc error:', err);
    res.status(500).json({ error: 'Failed to merge Ydoc' });
  }
};
