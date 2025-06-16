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

const deleteAnimal = async (req, res) => {
    const { id } = req.params;
    try {
        let existData = await getData(animalFilePath);

        // Ensure it's a flat array
        if (Array.isArray(existData) && existData.length === 1 && Array.isArray(existData[0])) {
            existData = existData[0]; // Flatten if accidentally nested
        }

        // Check if data is valid
        if (!Array.isArray(existData)) {
            console.error("Data format error: Expected an array but got:", existData);
            return res.status(500).json({ message: "Data format error" });
        }

        const animalIndex = existData.findIndex((animal) => animal.id === id);
        if (animalIndex === -1) {
            return res.status(404).json({ message: `Animal with id ${id} not found` });
        }

        existData.splice(animalIndex, 1);
        await writeData(animalFilePath, existData);
        res.status(200).json({ message: 'Animal deleted successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};

const relocateAnimal = async (req, res) => {
    const { animalId, pastureId } = req.body;
    if (!animalId || !pastureId) {
        return res.status(400).json({ message: "Missing required fields: 'animalId' or 'pastureId'" });
    }
    try {
        let existData = await getData(animalFilePath);


        if (Array.isArray(existData) && existData.length === 1 && Array.isArray(existData[0])) {
            existData = existData[0];
        }

        // Check if data is valid
        if (!Array.isArray(existData)) {
            console.error("Data format error: Expected an array but got:", existData);
            return res.status(500).json({ message: "Data format error" });
        }

        const animalIndex = existData.findIndex((animal) => animal.id === animalId);
        if (animalIndex === -1) {
            return res.status(404).json({ message: `Animal with id ${animalId} not found` });
        }

        existData[animalIndex].pastureId = pastureId;

        const writeData = async (filePath, data) => {
            await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        };
        
        await writeData(animalFilePath, existData);
        res.status(200).json({ message: 'Animal relocated successfully' });
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
    updateAnimalCoordinates,
    relocateAnimal,
    deleteAnimal
};