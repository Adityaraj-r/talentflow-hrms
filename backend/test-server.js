const express = require('express');
const app = express();
const PORT = 3001;

app.get('/health', (req, res) => {
  console.log('✅ HEALTH ENDPOINT HIT!');
  res.json({ success: true, message: 'It works!' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log('========================================');
  console.log('✅ SERVER STARTED SUCCESSFULLY');
  console.log(`✅ Listening on http://127.0.0.1:${PORT}`);
  console.log('========================================');
});
