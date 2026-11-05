const express = require('express');
const path = require('path');
const app = express();
app.use('/mangud', express.static(path.join(__dirname, 'dist')));
app.use((req, res) => res.send('FALLBACK: ' + req.url));
app.listen(3001, () => console.log('Listening'));
