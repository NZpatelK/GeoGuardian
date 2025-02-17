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

module.exports = {
    getPastures,
    getPastureById,
    addPasture,
};
