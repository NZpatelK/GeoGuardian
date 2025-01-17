const request = require('supertest');
const { getFields, addField } = require('../controllers/fieldController'); // Adjust the path as necessary
const express = require('express');
const app = express();
app.use(express.json());
app.get('/fields', getFields);
app.post('/fields', addField);

// Mocking the helper functions
jest.mock('../utils/dbHelpers', () => ({
    getData: jest.fn(),
    writeData: jest.fn(),
    handleDBError: jest.fn(),
}));

const { getData, writeData, handleDBError } = require('../utils/dbHelpers');

describe('Field Controller Tests', () => {
    
    describe('GET /fields', () => {
        it('should return a list of fields', async () => {
            // Mock the return value for getData
            const mockFields = [{ id: 1, name: 'Field 1' }];
            getData.mockResolvedValue(mockFields);

            const response = await request(app).get('/fields');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockFields);
            expect(getData).toHaveBeenCalledWith(expect.any(String)); // Checks that getData was called with the correct file path
        });

        it('should handle errors and return 500', async () => {
            const mockError = new Error('DB error');
            getData.mockRejectedValue(mockError);
            handleDBError.mockImplementation((res, error) => res.status(500).json({ message: error.message }));

            const response = await request(app).get('/fields');
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('DB error');
            expect(handleDBError).toHaveBeenCalledWith(expect.any(Object), mockError);
        });
    });

    describe('POST /fields', () => {
        it('should add a new field and return success', async () => {
            const newField = { id: 2, name: 'Field 2' };
            const existingData = [{ id: 1, name: 'Field 1' }];
            getData.mockResolvedValue(existingData);
            writeData.mockResolvedValue(null); // Mocking successful data write

            const response = await request(app).post('/fields').send(newField);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Data saved successfully');
            expect(writeData).toHaveBeenCalledWith(expect.any(String), newField, existingData);
        });

        it('should handle errors during the POST request', async () => {
            const newField = { id: 2, name: 'Field 2' };
            const mockError = new Error('DB error');
            getData.mockResolvedValue([]);
            writeData.mockRejectedValue(mockError);
            handleDBError.mockImplementation((res, error) => res.status(500).json({ message: error.message }));

            const response = await request(app).post('/fields').send(newField);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('DB error');
            expect(handleDBError).toHaveBeenCalledWith(expect.any(Object), mockError);
        });
    });
});
