// server.js
const express = require('express');
const fs = require('fs');  // To read files from the filesystem
const path = require('path');
const app = express();
const port = 3000;

// Serve data from the data.json file
app.get('/api/users', (req, res) => {
  const filePath = path.join(__dirname, './data/data.json');
  
  // Read the data.json file and send it as a response
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading the data file');
    }
    // Parse the JSON data and send it in the response
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
