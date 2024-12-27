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
 
const dummyData = [
  {
    "id": "3EQgVfD9gFCJTS9ptainQ",
    "name": "Cow Home",
    "coordinates": [
      {
        "lat": 37.77299146011582,
        "lng": -122.44589809872755
      },
      {
        "lat": 37.772106169374155,
        "lng": -122.44573238876632
      },
      {
        "lat": 37.77268640985531,
        "lng": -122.44079964014655
      },
      {
        "lat": 37.773649282672274,
        "lng": -122.44095135728858
      },
      {
        "lat": 37.77299146011582,
        "lng": -122.44589809872755
      }
    ]
  },
  {
    "id": "HkZnCQFYM0uRkQoA0jxfV",
    "name": "Cow Home",
    "coordinates": [
      {
        "lat": 37.77047148374791,
        "lng": -122.44336704677875
      },
      {
        "lat": 37.77087763460478,
        "lng": -122.44047685700309
      },
      {
        "lat": 37.77053080105853,
        "lng": -122.43959978114759
      },
      {
        "lat": 37.7700315264569,
        "lng": -122.43920731056296
      },
      {
        "lat": 37.7690875676129,
        "lng": -122.43832397650236
      },
      {
        "lat": 37.76839553112356,
        "lng": -122.4388591689311
      },
      {
        "lat": 37.76812183870735,
        "lng": -122.43936521434905
      },
      {
        "lat": 37.76785474141628,
        "lng": -122.4400197762454
      },
      {
        "lat": 37.76748810518271,
        "lng": -122.44037643598978
      },
      {
        "lat": 37.7668965087766,
        "lng": -122.44076519800845
      },
      {
        "lat": 37.76599918793585,
        "lng": -122.4418941666192
      },
      {
        "lat": 37.765878851110735,
        "lng": -122.44238786946599
      },
      {
        "lat": 37.765968405180786,
        "lng": -122.44272169835098
      },
      {
        "lat": 37.76645011718263,
        "lng": -122.44316608885941
      },
      {
        "lat": 37.76698633645669,
        "lng": -122.44374659532879
      },
      {
        "lat": 37.767563044970444,
        "lng": -122.44388647780204
      },
      {
        "lat": 37.76894227163533,
        "lng": -122.44334265136813
      },
      {
        "lat": 37.769478289617,
        "lng": -122.44250874553856
      },
      {
        "lat": 37.76959440648521,
        "lng": -122.44243034413577
      },
      {
        "lat": 37.76967997098779,
        "lng": -122.44278358504586
      },
      {
        "lat": 37.76994582494546,
        "lng": -122.44317037688883
      },
      {
        "lat": 37.77047148374791,
        "lng": -122.44336704677875
      }
    ]
  },
  {
    "id": "x-TPvphQsc9QFz3Q8qIjK",
    "name": "Cow Home",
    "coordinates": [
      {
        "lat": 37.779829374902974,
        "lng": -122.40716020093029
      },
      {
        "lat": 37.77853160012182,
        "lng": -122.40563450118374
      },
      {
        "lat": 37.77674964335803,
        "lng": -122.40783626901612
      },
      {
        "lat": 37.777967693516,
        "lng": -122.40934060437553
      },
      {
        "lat": 37.779829374902974,
        "lng": -122.40716020093029
      }
    ]
  }
];

function initaliseDataFile() {
  if (fs.existsSync(filePath)) {
    console.log("File exists. Clearing and adding dummy data.");
    fs.writeFileSync(filePath, JSON.stringify(dummyData, null, 2), 'utf8');

  } else {
    console.log("File does not exist. Creating new file with dummy data.");
    fs.writeFileSync(filePath, JSON.stringify(dummyData, null, 2), 'utf8');
  }
}

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
  initaliseDataFile();
  console.log(`Server running at http://localhost:${port}`);
});
