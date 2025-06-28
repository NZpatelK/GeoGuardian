import request from 'supertest';
import express from 'express';
import pastureController from '../controllers/pastureController.js';
import * as dbHelpers from '../utils/dbHelpers.js';
import fs from 'fs/promises';

jest.mock('../utils/dbHelpers.js');
jest.mock('fs/promises');

const app = express();
app.use(express.json());

// Routes
app.get('/pastures', pastureController.getPastures);
app.get('/pastures/:id', pastureController.getPastureById);
app.post('/pastures', pastureController.addPasture);
app.put('/pastures', pastureController.updatePasture);
app.delete('/pastures/:id', pastureController.deletePasture);

// Mock data
const mockPastures = [
  { id: '1', name: 'Alpha', coordinates: [[1, 2]] },
  { id: '2', name: 'Beta', coordinates: [[3, 4]] }
];

describe('Pasture Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /pastures should return all pastures', async () => {
    dbHelpers.getData.mockResolvedValue(mockPastures);

    const res = await request(app).get('/pastures');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockPastures);
    expect(dbHelpers.getData).toHaveBeenCalled();
  });

  test('GET /pastures/:id should return specific pasture', async () => {
    dbHelpers.getData.mockResolvedValue(mockPastures);

    const res = await request(app).get('/pastures/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockPastures[0]);
  });

  test('POST /pastures should add a new pasture', async () => {
    const newPasture = { id: '3', name: 'Gamma', coordinates: [[5, 6]] };
    dbHelpers.getData.mockResolvedValue(mockPastures);
    dbHelpers.writeData.mockResolvedValue();

    const res = await request(app).post('/pastures').send(newPasture);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Gamma data saved successfully/);
    expect(dbHelpers.writeData).toHaveBeenCalledWith(expect.any(String), newPasture, mockPastures);
  });

  test('PUT /pastures should update coordinates', async () => {
    const updated = {
      id: '1',
      coordinates: [[10, 10]]
    };

    const existing = [...mockPastures];

    dbHelpers.getData.mockResolvedValue(existing);
    fs.writeFile.mockResolvedValue();

    const res = await request(app).put('/pastures').send(updated);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Updated Alpha successfully/);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('DELETE /pastures/:id should delete a pasture', async () => {
    dbHelpers.getData.mockResolvedValue([...mockPastures]);
    fs.writeFile.mockResolvedValue();

    const res = await request(app).delete('/pastures/1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Alpha deleted successfully/);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('PUT /pastures returns 404 if pasture not found', async () => {
    dbHelpers.getData.mockResolvedValue([...mockPastures]);
    const res = await request(app).put('/pastures').send({
      id: '99',
      coordinates: [[1, 2]]
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/);
  });

  test('DELETE /pastures/:id returns 404 if not found', async () => {
    dbHelpers.getData.mockResolvedValue([...mockPastures]);
    const res = await request(app).delete('/pastures/99');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/);
  });
});
