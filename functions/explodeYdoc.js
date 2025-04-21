import * as Y from 'yjs';

/**
 * Handler for POST /explodeYdoc
 * Expects JSON body: { base64: string }
 * Returns: { fullState: Record<string, any> }
 */
export default function explodeYdocHandler(req, res) {
  try {
    const { base64 } = req.body;
    if (typeof base64 !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid `base64` field' });
    }

    // 1) Decode and apply the Yjs update
    const doc = new Y.Doc();
    const update = Buffer.from(base64, 'base64');
    Y.applyUpdate(doc, update);

    // 2) Extract all entries from the "fields" map
    const map = doc.getMap('fields');
    const fullState = {};
    for (const [key, value] of map.entries()) {
      fullState[key] = value;
    }

    // 3) Return the exploded JSON state
    res.json({ fullState });
  } catch (err) {
    console.error('explodeYdoc error:', err);
    res.status(500).json({ error: 'Failed to explode Ydoc' });
  }
}
