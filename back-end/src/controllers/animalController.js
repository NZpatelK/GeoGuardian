import path from 'path';
import { faker } from '@faker-js/faker';
import { getData, writeData, handleDBError, getDatabyId } from '../utils/dbHelpers.js';
import { getRandomCoordinate, getWeightedStatus } from '../utils/randomUtils.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
        const age = faker.number.int({ min: 1, max: 10 });
        const newStatus = getWeightedStatus();
        const newAnimal = { id: newId, ...data, age, status: newStatus, coordinates: animalCoordinates };

        await writeData(animalFilePath, newAnimal, existData);

        res.status(200).json({ message: `${data.name} data saved successfully`, animal: newAnimal });
    } catch (error) {
        handleDBError(res, error);
    }
};

const deleteAnimal = async (req, res) => {
    const { id } = req.params;

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

        await writeData(animalFilePath, null, existData);
        res.status(200).json({ message: `Animal with ID ${id} has been removed successfully.` });
    } catch (error) {
        console.error("Error deleting animal:", error);
        handleDBError(res, error);
    }
};

/**
 * Relocates an animal to a different pasture.
 * @param {Object} req The request object.
 * @param {number} req.body.animalId The id of the animal to be relocated.
 * @param {string} req.body.pastureId The id of the pasture to which the animal is to be relocated.
 * @param {Object} res The response object.
 * @returns {Promise<void>} A promise that resolves if the relocation is successful.
 */
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

        await writeData(animalFilePath, null, existData);
        res.status(200).json({ message: `Animal with ID ${animalId} has been relocated successfully.` });
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