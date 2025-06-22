import fs from 'fs';
import path from 'path';
import { getData, writeData, handleDBError } from '../utils/dbHelpers.js';

// For __dirname in ES Modules (since it's not defined by default)
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { de } from '@faker-js/faker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pastureFilePath = path.join(__dirname, '../data/PastureData.json');


const getPastures = async (req, res) => {
    try {
        const fetchData = await getData(pastureFilePath);
        res.json(fetchData);
    } catch (error) {
        handleDBError(res, error);
    }
};

const getPastureById = async (req, res) => {
    try {
        const fetchData = await getData(pastureFilePath);
        const pasture = fetchData.find((pasture) => pasture.id === req.params.id);
        res.json(pasture);
    } catch (error) {
        handleDBError(res, error);
    }
};

const addPasture = async (req, res) => {
    const data = req.body;

    try {
        const existData = await getData(pastureFilePath);
        await writeData(pastureFilePath, data, existData);
        res.status(200).json({ message: 'Pasture data saved successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};

const updatePasture = async (req, res) => {
    const { id, coordinates } = req.body;

    if (!id || !coordinates) {
        return res.status(400).json({ message: "Missing required fields: 'id' or 'coordinates'" });
    }

    try {
        let existData = await getData(pastureFilePath);

        // Ensure it's a flat array
        if (Array.isArray(existData) && existData.length === 1 && Array.isArray(existData[0])) {
            existData = existData[0]; // Flatten if accidentally nested
        }

        // Check if data is valid
        if (!Array.isArray(existData)) {
            console.error("Data format error: Expected an array but got:", existData);
            return res.status(500).json({ message: "Data format error" });
        }

        const pastureIndex = existData.findIndex((pasture) => pasture.id === id);
        if (pastureIndex === -1) {
            return res.status(404).json({ message: `Pasture with id ${id} not found` });
        }

        // Update the specific pasture's coordinates
        existData[pastureIndex] = { ...existData[pastureIndex], coordinates };

        // Clear the file and write the updated data
        await fs.promises.writeFile(pastureFilePath, JSON.stringify(existData, null, 2)); // Overwrite the file

        return res.status(200).json({ message: "Updated Pasture successfully" });
    } catch (error) {
        console.error("Error updating pasture:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const deletePasture = async (req, res) => {
    const id = req.params.id;

    try {
        let existData = await getData(pastureFilePath);

        // Ensure it's a flat array
        if (Array.isArray(existData) && existData.length === 1 && Array.isArray(existData[0])) {
            existData = existData[0]; // Flatten if accidentally nested
        }

        // Check if data is valid
        if (!Array.isArray(existData)) {
            console.error("Data format error: Expected an array but got:", existData);
            return res.status(500).json({ message: "Data format error" });
        }

        const pastureIndex = existData.findIndex((pasture) => pasture.id === id);
        if (pastureIndex === -1) {
            return res.status(404).json({ message: `Pasture with id ${id} not found` });
        }

        // Remove the specific pasture
        existData.splice(pastureIndex, 1);

        // Clear the file and write the updated data
        await fs.promises.writeFile(pastureFilePath, JSON.stringify(existData, null, 2)); // Overwrite the file

        return res.status(200).json({ message: "Pasture deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting pasture:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}





export default {
    getPastures,
    getPastureById,
    addPasture,
    updatePasture,
    deletePasture
};
