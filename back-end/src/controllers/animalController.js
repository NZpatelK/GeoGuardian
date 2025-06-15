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

const updateAnimalCoordinates = async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    try {
        const animals = await getData(animalFilePath);
        const animalIndex = animals.findIndex(animal => String(animal.id) === String(id).trim());
        if (animalIndex === -1) {
            return res.status(404).json({ message: 'Animal not found' });
        }

        animals[animalIndex].coordinates.lat = latitude;
        animals[animalIndex].coordinates.lng = longitude;

        const writeData = async (filePath, data) => {
            await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        };

        await writeData(animalFilePath, animals);
        res.status(200).json({ message: 'Animal coordinates updated successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};


module.exports = {
    getAnimals,
    addAnimal,
    updateAnimalCoordinates
};