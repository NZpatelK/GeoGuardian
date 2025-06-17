// Change CommonJS `require` to ES Module `import`
import fs from 'fs';
import path from 'path';
import { faker } from '@faker-js/faker';

import { getData, writeData, handleDBError, getDatabyId } from '../utils/dbHelpers.js';

// __dirname isn't defined in ESM by default; use this workaround:
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getRandomCoordinate } from '../utils/calculationUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const animalFilePath = path.join(__dirname, '../data/AnimalsData.json');
const pastureFilePath = path.join(__dirname, '../data/PastureData.json');

const getAnimals = async (_req, res) => {
    try {
        const fetchData = await getData(animalFilePath);
        res.json(fetchData);
    } catch (error) {
        handleDBError(res, error);
    }
}


const addAnimal = async (req, res) => {
    try {
        const data = req.body;
        const existData = await getData(animalFilePath);
        const existingIds = new Set(existData.map(animal => animal.id));

        let newId;
        do {
            newId = faker.number.int({ min: 1000, max: 9999 });
        } while (existingIds.has(newId));

        const pastureData = await getDatabyId(pastureFilePath, data.pastureId);

        const animalCoordinates = getRandomCoordinate(pastureData[0])
        const newAnimal = { id: newId, ...data, coordinates: animalCoordinates };

        console.log("Adding new animal:", newAnimal);

        await writeData(animalFilePath, newAnimal, existData);

        res.status(200).json({ message: 'Data saved successfully', animal: newAnimal });
    } catch (error) {
        handleDBError(res, error);
    }
};


const deleteAnimal = async (req, res) => {
    const { id } = req.params;
    console.log("Deleting animal with id:", id);

    try {
        let existData = await getData(animalFilePath);

        // Flatten if accidentally nested
        if (Array.isArray(existData) && existData.length === 1 && Array.isArray(existData[0])) {
            existData = existData[0];
        }

        // Ensure valid data structure
        if (!Array.isArray(existData)) {
            console.error("Data format error: Expected an array but got:", existData);
            return res.status(500).json({ message: "Data format error" });
        }

        const animalIndex = existData.findIndex((animal) => String(animal.id) === String(id).trim());
        if (animalIndex === -1) {
            return res.status(404).json({ message: `Animal with id ${id} not found` });
        }

        existData.splice(animalIndex, 1);

        // const writeData = async (filePath, data) => {
        //     await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        // };

        await writeData(animalFilePath, null, existData);
        res.status(200).json({ message: 'Animal deleted successfully' });
    } catch (error) {
        console.error("Error deleting animal:", error);
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

        // const writeData = async (filePath, data) => {
        //     await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        // };

        await writeData(animalFilePath, null, existData);
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

        // const writeData = async (filePath, data) => {
        //     await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        // };

        await writeData(animalFilePath, null, animals);
        res.status(200).json({ message: 'Animal coordinates updated successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};


export default {
    getAnimals,
    addAnimal,
    updateAnimalCoordinates,
    relocateAnimal,
    deleteAnimal
};