import { de } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';


export const getData = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    resolve(JSON.parse(data));
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
};

export const writeData = (filePath, data, existData) => {
    return new Promise((resolve, reject) => {
        let currentData = [];
        try {
            currentData = existData;
            if (!Array.isArray(currentData)) {
                currentData = [];
            }
        } catch (parseError) {
            reject(parseError);
        }

        currentData.push(data);

        fs.promises.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf8')
            .then(() => resolve())
            .catch(err => reject(err));
    });
};

export const getDatabyId = (filePath, id) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const parsedData = JSON.parse(data);
                    const filteredData = parsedData.filter(item => item.id === id);
                    resolve(filteredData);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
};

export const handleDBError = (res, error) => {
    let errorCode, errorMessage, errorDetails;

    if (error.code === 'ENOENT') {
        errorCode = 404;
        errorMessage = 'Data file not found';
    } else if (error instanceof SyntaxError) {
        errorCode = 400;
        errorMessage = 'Invalid data format in the file';
    } else if (error.code === 'EACCES') {
        errorCode = 403;
        errorMessage = 'Permission denied to access file';
    } else {
        errorCode = 500;
        errorMessage = 'Internal server error';
    }

    if (error) {
        errorDetails = error.message || error;
    }

    res.status(errorCode).json({
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
    });
};
