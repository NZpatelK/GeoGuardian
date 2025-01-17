const fs = require('fs');
const { handleError, getFields, addField, getData, writeData } = require('../controllers/fieldController'); // Adjust the import paths

jest.mock('fs'); // Mock fs module

describe('Error Handling Tests', () => {
    
    test('should return 404 for file not found (ENOENT)', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Simulate fs.readFile throwing ENOENT error
        fs.readFile.mockImplementation((path, encoding, callback) => {
            callback({ code: 'ENOENT' }, null);
        });

        // Call the function that uses handleError (e.g., getFields)
        await getFields({}, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            code: 404,
            message: 'Data file not found',
            details: undefined,
        });
    });

    test('should return 400 for invalid JSON (SyntaxError)', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Simulate fs.readFile throwing SyntaxError
        fs.readFile.mockImplementation((path, encoding, callback) => {
            callback(null, 'Invalid JSON String'); // Invalid JSON
        });

        // Call the function that uses handleError (e.g., getFields)
        await getFields({}, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            code: 400,
            message: 'Invalid data format in the file',
            details: expect.any(String),
        });
    });

    test('should return 500 for general server error', async () => {
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Simulate a general error
        fs.readFile.mockImplementation((path, encoding, callback) => {
            callback(new Error('Some server error'), null);
        });

        // Call the function that uses handleError (e.g., getFields)
        await getFields({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            code: 500,
            message: 'Internal server error',
            details: expect.any(String),
        });
    });

    test('should return 200 for successful data saving in addField', async () => {
        const req = { body: { name: 'New Field' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock the successful data read and write
        fs.readFile.mockImplementation((path, encoding, callback) => {
            callback(null, JSON.stringify([{ name: 'Old Field' }]));
        });
        fs.writeFile.mockImplementation((path, data, encoding, callback) => {
            callback(null); // No error
        });

        await addField(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Data saved successfully',
        });
    });

    test('should return 500 when writeData throws error', async () => {
        const req = { body: { name: 'New Field' } };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // Mock the fs.readFile to return valid data
        fs.readFile.mockImplementation((path, encoding, callback) => {
            callback(null, JSON.stringify([{ name: 'Old Field' }]));
        });

        // Simulate an error while writing to the file
        fs.writeFile.mockImplementation((path, data, encoding, callback) => {
            callback(new Error('Write failed'));
        });

        await addField(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            code: 500,
            message: 'Internal server error',
            details: expect.any(String),
        });
    });
});
