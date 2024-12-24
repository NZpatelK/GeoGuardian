// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
app.use(express.json());



const filePath = path.join(__dirname, './data/FieldData.json');

// Check if the file exists. If not, create a new file with an empty array.
fs.access(filePath, fs.constants.F_OK, (err) => {
  if (err) {
    // File does not exist, create it with an empty array
    fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
    console.log('data.json file created');
  } else {
    console.log('data.json file exists');
  }
});



app.get('/api/field-data', (req, res) => {
    const filePath = path.join(__dirname, './data/FieldData.json');

    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading the data file');
        }

        res.json(JSON.parse(data));
    });
});

app.post('/save-data', (req, res) => {
    const data = req.body; // Get data from the request body
    console.log(data);
  
    // Read the existing data from the JSON file
    fs.readFile(filePath, 'utf8', (err, jsonData) => {
      if (err) {
        return res.status(500).json({ message: 'Error reading data file' });
      }
  
      let currentData = [];
      try {
        // Ensure the file content is parsed as an array
        currentData = JSON.parse(jsonData);
        if (!Array.isArray(currentData)) {
          currentData = []; // Reset to an empty array if data is not an array
        }
      } catch (parseError) {
        return res.status(500).json({ message: 'Error parsing data file' });
      }
  
      currentData.push(data); // Append the new data
  
      // Write the updated data to the JSON file
      fs.writeFile(filePath, JSON.stringify(currentData, null, 2), (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error saving data' });
        }
        res.status(200).json({ message: 'Data saved successfully' });
      });
    });
  });


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
