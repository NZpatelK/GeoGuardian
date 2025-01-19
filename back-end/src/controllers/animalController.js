const fs = require('fs');
const path = require('path');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers');
const animalFilePath = path.join(__dirname, '../data/AnimalsData.json');

const getAnimals = async (req, res) => {
    
    try {
        const fetchData = await getData(animalFilePath);
        res.json(fetchData);
    } catch (error) {
        handleDBError(res, error); 
    }
}

const addAnimal = async (req, res) => {
    const data = req.body;
    try {
        const existData = await getData(animalFilePath);
        await writeData(animalFilePath, data, existData);
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};

module.exports = {
    getAnimals,
    addAnimal
};