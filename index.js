import express from 'express';
import mergeYdocHandler from './mergeYdoc.js';
import explodeYdocHandler from './explodeYdoc.js';

const app = express();
app.use(express.json());

// Route to merge a patch into an existing Yjs document
app.post('/mergeYdoc', mergeYdocHandler);

// Route to explode a Yjs document back into its full JSON state
app.post('/explodeYdoc', explodeYdocHandler);

const PORT = process.env.PORT || 9033;
app.listen(PORT, () => {
  console.log(`Ydoc merge/explode service listening on port ${PORT}`);
});
