const { getAnimals, addAnimal } = require('../controllers/animalController');
const { getData, writeData, handleDBError } = require('../utils/dbHelpers');
const path = require('path');

jest.mock('../utils/dbHelpers'); // Mocking the dbHelpers module

const animalFilePath = path.join(__dirname, '../data/AnimalsData.json');

describe('getAnimals', () => {
    let res;

    beforeEach(() => {
        res = {
            json: jest.fn(),
        };
    });

    it('should fetch and return animal data', async () => {
        const mockData = [{ id: 1, name: 'Lion' }];
        getData.mockResolvedValue(mockData);

        await getAnimals({}, res);

        expect(getData).toHaveBeenCalledWith(animalFilePath);
        expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle errors by calling handleDBError', async () => {
        const error = new Error('Unable to fetch data');
        getData.mockRejectedValue(error);
        const handleDBErrorMock = jest.spyOn(require('../utils/dbHelpers'), 'handleDBError');
        const req = {};

        await getAnimals(req, res);

        expect(getData).toHaveBeenCalledWith(animalFilePath);
        expect(handleDBError).toHaveBeenCalledWith(res, error);
        handleDBErrorMock.mockRestore();
    });
});

describe('addAnimal', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: { id: 2, name: 'Elephant' },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    it('should add new animal data successfully', async () => {
        const mockExistingData = [{ id: 1, name: 'Lion' }];
        getData.mockResolvedValue(mockExistingData);
        writeData.mockResolvedValue();

        await addAnimal(req, res);

        expect(getData).toHaveBeenCalledWith(animalFilePath);
        expect(writeData).toHaveBeenCalledWith(animalFilePath, req.body, mockExistingData);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ message: 'Data saved successfully' });
    });

    it('should handle errors when adding animal data', async () => {
        const error = new Error('Unable to save data');
        getData.mockRejectedValue(error);

        await addAnimal(req, res);

        expect(getData).toHaveBeenCalledWith(animalFilePath);
        expect(handleDBError).toHaveBeenCalledWith(res, error);
    });
});
