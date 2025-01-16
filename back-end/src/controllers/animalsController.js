const fs = require('fs');
const path = require('path');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers');
const animalFilePath = path.join(__dirname, '../data/AnimalsData.json');

const getAnimals = async (req, res) => {
    
    // fs.readFile(animalFilePath, 'utf-8', (err, data) => {
    //     if (err) {
    //         return res.status(500).send('Error reading the data file');
    //     }

    //     res.json(JSON.parse(data));
    // });

    try {
        const fetchData = await getData(animalFilePath);
        res.json(fetchData);
    } catch (error) {
        handleDBError(res, error); 
    }
}

const addAnimal = async (req, res) => {
    const data = req.body; // Get data from the request body

    // // Read the existing data from the JSON file
    // fs.readFile(animalFilePath, 'utf8', (err, jsonData) => {
    //     if (err) {
    //         return res.status(500).json({ message: 'Error reading data file' });
    //     }

    //     let currentData = [];

    //     try {
    //         currentData = JSON.parse(jsonData);
    //         if (!Array.isArray(currentData)) {
    //             currentData = [];
    //         }
    //     } catch (parseError) {
    //         return res.status(500).json({ message: 'Error parsing data file' });
    //     }    

    //     currentData.push(data);

    //     fs.writeFile(animalFilePath, JSON.stringify(currentData, null, 2), (err) => {
    //         if (err) {
    //             return res.status(500).json({ message: 'Error saving data' });
    //         }
    //         res.status(200).json({ message: 'Data saved successfully' });
    //     });
    // }); 
};

module.exports = {
    getAnimals,
    addAnimal
};