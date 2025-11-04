// Final robust server.js
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// --- STATIC SETUP + DEBUG LOGS ---
const publicDir = __dirname; // same folder as server.js
const indexPath = path.join(publicDir, 'index.html');
console.log('Serving static from:', publicDir);
console.log('index.html exists?', fs.existsSync(indexPath));

app.use(express.static(publicDir));

// Explicit fallback for "/"
app.get('/', (req, res) => {
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  res.status(404).send('index.html not found in ' + publicDir);
});

// --- SIMPLE IN-MEMORY BILLING ---
let calls = [];
const ratePerMinute = 0.5;

// Add a call
app.post('/addcall', (req, res) => {
  const { number, duration } = req.body;
  if (!number || !duration) {
    return res.status(400).json({ message: 'Please provide number and duration' });
  }
  calls.push({ number, duration: Number(duration) });
  res.json({ message: 'Call added successfully!' });
});

// Get bill
app.get('/bill/:number', (req, res) => {
  const number = req.params.number;
  const userCalls = calls.filter(c => c.number === number);
  if (userCalls.length === 0) {
    return res.json({ message: 'No calls found for this number' });
  }

  let total = 0;
  const details = userCalls.map(c => {
    const minutes = Math.ceil(c.duration / 60);
    const charge = minutes * ratePerMinute;
    total += charge;
    return { duration: c.duration, minutes, charge: Number(charge.toFixed(2)) };
  });

  res.json({
    number,
    ratePerMinute,
    totalCalls: userCalls.length,
    totalBill: Number(total.toFixed(2)),
    calls: details
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Billing app running at http://localhost:${PORT}`));
