// index.js
const express    = require('express');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');

const app = express();
app.use(bodyParser.json());

// auto‑mount all fns in /functions as POST /<name>
fs.readdirSync(path.join(__dirname, 'functions'))
  .filter(fn => fn.endsWith('.js'))
  .forEach(fn => {
    const name = fn.replace(/\.js$/, '');
    const handler = require(`./functions/${fn}`);
    app.post(`/${name}`, async (req, res) => {
      try {
        const out = await handler(req.body);
        res.json(out);
      } catch (err) {
        console.error(name, err);
        res.status(500).json({error: err.message});
      }
    });
  });

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
