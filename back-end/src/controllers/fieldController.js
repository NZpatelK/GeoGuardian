const fs = require('fs');
const path = require('path');
const fieldFilePath = path.join(__dirname, '../data/FieldData.json');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers');

const getFields = async (req, res) => {
    try {
        const fetchData = await getData(fieldFilePath);
        res.json(fetchData);
    } catch (error) {
        handleDBError(res, error);
    }
};

const addField = async (req, res) => {
    const data = req.body; 

    try {
        const existData = await getData(fieldFilePath);
        // currentData.push(data);
        await writeData(fieldFilePath, data, existData);
        res.status(200).json({ message: 'Data saved successfully' });
    } catch (error) {
        handleDBError(res, error);
    }
};

module.exports = {
    getFields,
    addField
};
