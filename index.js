const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();

app.use(express.json());

/* 1) Auto‑mount all functions in /functions as POST /<name> */
fs.readdirSync(path.join(__dirname, 'functions'))
  .filter(fn => fn.endsWith('.js'))
  .forEach(fn => {
    const name    = fn.replace(/\.js$/, '');
    const handler = require(`./functions/${fn}`);
    app.post(`/${name}`, async (req, res) => {
      try {
        const out = await handler(req.body);
        res.json(out);
      } catch (err) {
        console.error(name, err);
        res.status(500).json({ error: err.message });
      }
    });
  });

/* 2) Health check endpoint */
app.get('/healthz', (_req, res) => res.sendStatus(200));

/* 3) Start the server */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Functions container listening on port ${PORT}`));
