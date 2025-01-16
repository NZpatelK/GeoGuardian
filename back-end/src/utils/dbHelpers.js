const fs = require('fs');
const path = require('path');


const getData = (filePath) => {
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

const writeData = (filePath, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const handleDBError = (res, error) => {
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

module.exports = {
    getData,
    writeData,
    handleDBError
}