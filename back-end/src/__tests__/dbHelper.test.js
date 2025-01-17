const fs = require('fs');
const path = require('path');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers'); // Adjust the path to your module

jest.mock('fs');  // Mock fs module

describe('File Operations', () => {

    describe('getData', () => {
        it('should resolve with parsed data when file is read successfully', async () => {
            const filePath = 'path/to/file.json';
            const mockData = '{"key": "value"}';
            fs.readFile.mockImplementation((path, encoding, callback) => callback(null, mockData));

            const result = await getData(filePath);

            expect(result).toEqual({ key: 'value' });
        });

        it('should reject with error if file read fails', async () => {
            const filePath = 'path/to/file.json';
            const error = new Error('File not found');
            fs.readFile.mockImplementation((path, encoding, callback) => callback(error));

            await expect(getData(filePath)).rejects.toThrow(error);
        });

        it('should reject with error if JSON parsing fails', async () => {
            const filePath = 'path/to/file.json';
            const invalidJsonData = '{"key": value}';
            fs.readFile.mockImplementation((path, encoding, callback) => callback(null, invalidJsonData));

            await expect(getData(filePath)).rejects.toThrow(SyntaxError);
        });
    });

    describe('writeData', () => {
        it('should write data to file', async () => {
            const filePath = 'path/to/file.json';
            
            // Manually setting the data
            const existingData = [{ key: 'oldValue' }];
            const data = { key: 'newValue' };
    
            // Mock the fs.writeFile method
            fs.writeFile.mockImplementation((path, data, encoding, callback) => {
                // You can check or manipulate the 'data' here manually
                expect(path).toBe(filePath); // Ensure the file path is correct
                expect(encoding).toBe('utf8'); // Ensure encoding is correct
                const parsedData = JSON.parse(data);
                expect(parsedData).toEqual([...existingData, data]); // Check the correct data is passed
                
                callback(null); // Simulate a successful write
            });
    
            // Call writeData and ensure it behaves as expected
            await writeData(filePath, data, existingData);
    
            // Now check if writeFile was called with the expected parameters
            expect(fs.writeFile).toHaveBeenCalled();
        });

        it('should reject with error if write fails', async () => {
            const filePath = 'path/to/file.json';
            const data = { key: 'newValue' };
            const existingData = [{ key: 'oldValue' }];
            const error = new Error('Write failed');
            fs.writeFile.mockImplementation((path, data, encoding, callback) => callback(error));

            await expect(writeData(filePath, data, existingData)).rejects.toThrow(error);
        });

        it('should initialize currentData as an empty array if existData is not an array', async () => {
            const filePath = 'path/to/file.json';
            const data = { key: 'newValue' };
            const existData = {}; // Not an array
            fs.writeFile.mockImplementation((path, data, encoding, callback) => callback(null));

            await writeData(filePath, data, existData);

            expect(fs.writeFile).toHaveBeenCalledWith(filePath, JSON.stringify([data], null, 2), 'utf8', expect.any(Function));
        });
    });

    describe('handleDBError', () => {
        it('should handle ENOENT error', () => {
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const error = { code: 'ENOENT', message: 'File not found' };

            handleDBError(res, error);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                code: 404,
                message: 'Data file not found',
                details: 'File not found'
            });
        });

        it('should handle SyntaxError', () => {
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const error = new SyntaxError('Invalid JSON format');

            handleDBError(res, error);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                code: 400,
                message: 'Invalid data format in the file',
                details: 'Invalid JSON format'
            });
        });

        it('should handle EACCES error', () => {
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const error = { code: 'EACCES', message: 'Permission denied' };

            handleDBError(res, error);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                code: 403,
                message: 'Permission denied to access file',
                details: 'Permission denied'
            });
        });

        it('should handle unknown errors', () => {
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
            const error = new Error('Unknown error');

            handleDBError(res, error);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                code: 500,
                message: 'Internal server error',
                details: 'Unknown error'
            });
        });
    });

});
