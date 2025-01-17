const request = require('supertest');
const { getPastures, addPasture } = require('../controllers/pastureController'); // Adjust the path as necessary
const express = require('express');
const app = express();
app.use(express.json());
app.get('/pastures', getPastures);
app.post('/pastures', addPasture);

// Mocking the helper functions
jest.mock('../utils/dbHelpers', () => ({
    getData: jest.fn(),
    writeData: jest.fn(),
    handleDBError: jest.fn(),
}));

const { getData, writeData, handleDBError } = require('../utils/dbHelpers');

describe('Pasture Controller Tests', () => {
    
    describe('GET /pastures', () => {
        it('should return a list of pastures', async () => {
            // Mock the return value for getData
            const mockPastures = [{ id: 1, name: 'Pasture 1' }];
            getData.mockResolvedValue(mockPastures);

            const response = await request(app).get('/pastures');
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockPastures);
            expect(getData).toHaveBeenCalledWith(expect.any(String)); // Checks that getData was called with the correct file path
        });

        it('should handle errors and return 500', async () => {
            const mockError = new Error('DB error');
            getData.mockRejectedValue(mockError);
            handleDBError.mockImplementation((res, error) => res.status(500).json({ message: error.message }));

            const response = await request(app).get('/pastures');
            
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('DB error');
            expect(handleDBError).toHaveBeenCalledWith(expect.any(Object), mockError);
        });
    });

    describe('POST /pastures', () => {
        it('should add a new pasture and return success', async () => {
            const newPasture = { id: 2, name: 'Pasture 2' };
            const existingData = [{ id: 1, name: 'Pasture 1' }];
            getData.mockResolvedValue(existingData);
            writeData.mockResolvedValue(null); // Mocking successful data write

            const response = await request(app).post('/pastures').send(newPasture);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Data saved successfully');
            expect(writeData).toHaveBeenCalledWith(expect.any(String), newPasture, existingData);
        });

        it('should handle errors during the POST request', async () => {
            const newPasture = { id: 2, name: 'Pasture 2' };
            const mockError = new Error('DB error');
            getData.mockResolvedValue([]);
            writeData.mockRejectedValue(mockError);
            handleDBError.mockImplementation((res, error) => res.status(500).json({ message: error.message }));

            const response = await request(app).post('/pastures').send(newPasture);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('DB error');
            expect(handleDBError).toHaveBeenCalledWith(expect.any(Object), mockError);
        });
    });
});
