const fs = require('fs');
const path = require('path');
const pastureFilePath = path.join(__dirname, '../data/PastureData.json');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers');

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
        res.status(200).json({ message: 'Data saved successfully' });
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

        console.log("Before update:", JSON.stringify(existData, null, 2)); // Debugging

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

        // Log to check the data structure after update
        console.log("After update:", JSON.stringify(existData, null, 2)); // Debugging

        // Clear the file and write the updated data
        await fs.promises.writeFile(pastureFilePath, JSON.stringify(existData, null, 2)); // Overwrite the file

        return res.status(200).json({ message: "Data updated successfully" });
    } catch (error) {
        console.error("Error updating pasture:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};





module.exports = {
    getPastures,
    getPastureById,
    addPasture,
    updatePasture
};
