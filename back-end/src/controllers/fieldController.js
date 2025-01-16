const path = require('path');
const fieldFilePath = path.join(__dirname, '../data/FieldData.json');

const getFields = async (req, res) => {

      fs.readFile(fieldFilePath, 'utf-8', (err, data) => {
        if (err) {
          return res.status(500).send('Error reading the data file');
        }
    
        res.json(JSON.parse(data));
      });
};

const saveFields = async (req, res) => {
     const data = req.body; // Get data from the request body
      console.log(data);
    
      // Read the existing data from the JSON file
      fs.readFile(fieldFilePath, 'utf8', (err, jsonData) => {
        if (err) {
          return res.status(500).json({ message: 'Error reading data file' });
        }
    
        let currentData = [];

        try {
     
          currentData = JSON.parse(jsonData);
          if (!Array.isArray(currentData)) {
            currentData = []; 
          }
        } catch (parseError) {
          return res.status(500).json({ message: 'Error parsing data file' });
        }
    
        currentData.push(data);
    
        fs.writeFile(fieldFilePath, JSON.stringify(currentData, null, 2), (err) => {
          if (err) {
            return res.status(500).json({ message: 'Error saving data' });
          }
          res.status(200).json({ message: 'Data saved successfully' });
        });
      });
};

module.exports = {
    getFields,
    saveFields
};
