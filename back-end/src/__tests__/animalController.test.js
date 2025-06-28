import animalController from '../controllers/animalController.js';
import * as dbHelpers from '../utils/dbHelpers.js';
import * as randomUtils from '../utils/randomUtils.js';
import { faker } from '@faker-js/faker';

jest.mock('../utils/dbHelpers.js');
jest.mock('../utils/randomUtils.js');

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Animal Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAnimals', () => {
        it('should return animals data', async () => {
            const req = {};
            const res = mockRes();
            const mockData = [{ id: 1, name: 'Cow' }];

            dbHelpers.getData.mockResolvedValue(mockData);

            await animalController.getAnimals(req, res);

            expect(dbHelpers.getData).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockData);
        });
    });

    describe('addAnimal', () => {
        it('should add a new animal with unique ID and return it', async () => {
            const req = {
                body: {
                    name: 'Sheep',
                    pastureId: 'pasture-1'
                }
            };
            const res = mockRes();
            const existingAnimals = [{ id: 1001, name: 'Cow' }];
            const pastureData = [{ id: 'pasture-1', polygon: [] }];
            const fakeCoordinate = { lat: 1, lng: 1 };
            const fakeStatus = 'healthy';

            dbHelpers.getData.mockResolvedValue(existingAnimals);
            dbHelpers.getDatabyId.mockResolvedValue(pastureData);
            randomUtils.getRandomCoordinate.mockReturnValue(fakeCoordinate);
            randomUtils.getWeightedStatus.mockReturnValue(fakeStatus);
            dbHelpers.writeData.mockResolvedValue();

            await animalController.addAnimal(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('data saved successfully'),
                animal: expect.objectContaining({
                    name: 'Sheep',
                    status: fakeStatus,
                    coordinates: fakeCoordinate
                })
            }));
        });
    });

    describe('deleteAnimal', () => {
        it('should delete the animal if it exists', async () => {
            const req = { params: { id: '1001' } };
            const res = mockRes();
            const animals = [{ id: 1001, name: 'Sheep' }];

            dbHelpers.getData.mockResolvedValue(animals);
            dbHelpers.writeData.mockResolvedValue();

            await animalController.deleteAnimal(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('removed successfully')
            }));
        });

        it('should return 404 if animal not found', async () => {
            const req = { params: { id: '9999' } };
            const res = mockRes();

            dbHelpers.getData.mockResolvedValue([{ id: 1001, name: 'Sheep' }]);

            await animalController.deleteAnimal(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Animal with id 9999 not found' });
        });
    });

    describe('relocateAnimal', () => {
        it('should relocate an animal to another pasture', async () => {
            const req = {
                body: {
                    animalId: 1001,
                    pastureId: 'pasture-2'
                }
            };
            const res = mockRes();
            const animals = [{ id: 1001, pastureId: 'pasture-1' }];

            dbHelpers.getData.mockResolvedValue(animals);
            dbHelpers.writeData.mockResolvedValue();

            await animalController.relocateAnimal(req, res);

            expect(animals[0].pastureId).toBe('pasture-2');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if animal not found', async () => {
            const req = { body: { animalId: 1234, pastureId: 'pasture-1' } };
            const res = mockRes();
            dbHelpers.getData.mockResolvedValue([]);

            await animalController.relocateAnimal(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Animal with id 1234 not found'
            });
        });
    });

    describe('updateAnimalCoordinates', () => {
        it('should update animal coordinates', async () => {
            const req = {
                params: { id: '1001' },
                body: { latitude: 45.0, longitude: 90.0 }
            };
            const res = mockRes();
            const animals = [{ id: 1001, coordinates: { lat: 0, lng: 0 } }];

            dbHelpers.getData.mockResolvedValue(animals);
            dbHelpers.writeData.mockResolvedValue();

            await animalController.updateAnimalCoordinates(req, res);

            expect(animals[0].coordinates).toEqual({ lat: 45.0, lng: 90.0 });
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should return 404 if animal not found', async () => {
            const req = {
                params: { id: '1234' },
                body: { latitude: 45.0, longitude: 90.0 }
            };
            const res = mockRes();

            dbHelpers.getData.mockResolvedValue([]);

            await animalController.updateAnimalCoordinates(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});
