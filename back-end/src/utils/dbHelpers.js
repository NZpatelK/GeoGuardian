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

// export const writeData = async (filePath, data, existData = null, options = {}) => {
//   const { append = true } = options;

//   let currentData = [];

//   try {
//     if (existData) {
//       currentData = Array.isArray(existData) ? existData : [];
//     } else {
//       // Try reading from the file directly
//       const raw = await fs.promises.readFile(filePath, 'utf8');
//       const parsed = JSON.parse(raw);
//       currentData = Array.isArray(parsed) ? parsed : [];
//     }
//   } catch (err) {
//     // If file doesn't exist or is invalid, start with empty array
//     currentData = [];
//   }

//   if (append && data) {
//     if (Array.isArray(data)) {
//       currentData.push(...data); // Spread to flatten
//     } else if (typeof data === 'object') {
//       currentData.push(data);
//     }
//   } else if (!append && data) {
//     // Overwrite with new data instead of appending
//     currentData = Array.isArray(data) ? data : [data];
//   }

//   try {
//     await fs.promises.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf8');
//   } catch (err) {
//     throw err;
//   }
// };

export const writeData = async (filePath, data, existData = null, options = {}) => {
  const { append = true } = options;

  let currentData = [];

  try {
    if (existData !== null) {
      // Use the provided existData, but ensure it's an array
      currentData = Array.isArray(existData) ? [...existData] : [];
    } else {
      // Read from the file only if existData is NOT passed
      const raw = await fs.promises.readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      currentData = Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    currentData = [];
  }

  if (append && data) {
    if (Array.isArray(data)) {
      // Avoid duplicates by filtering out items already in currentData (simple shallow check)
      const filteredData = data.filter(
        item => !currentData.some(existing => JSON.stringify(existing) === JSON.stringify(item))
      );
      currentData.push(...filteredData);
    } else if (typeof data === 'object') {
      // Only add if not already present
      const exists = currentData.some(existing => JSON.stringify(existing) === JSON.stringify(data));
      if (!exists) {
        currentData.push(data);
      }
    }
  } else if (!append && data) {
    currentData = Array.isArray(data) ? data : [data];
  }

  try {
    await fs.promises.writeFile(filePath, JSON.stringify(currentData, null, 2), 'utf8');
  } catch (err) {
    throw err;
  }
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

/**
 * Handles a database error by sending a JSON response with the appropriate
 * HTTP status code and an error object with code, message, and details.
 *
 * @param {Response} res The Express.js response object
 * @param {Error} error The error that occurred
 */
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
