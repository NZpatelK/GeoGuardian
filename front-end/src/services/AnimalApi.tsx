import axios from "axios";
// import { nanoid } from 'nanoid';

export class AnimalApi {
    static async getAnimalsCoordinates() {
        try {
            const response = await axios.get('http://localhost:3000/api/animals/getAnimals');
            return response.data;
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }
    static async updateAnimalCoordinates(animalId: number, newCoordinates: { lat: number; lng: number }) {
        const data = {
            latitude: newCoordinates.lat,
            longitude: newCoordinates.lng,
        };
        try {
            // Send data to the backend using axios
            await axios.put(`http://localhost:3000/api/animals/updateAnimalCoordinates/${animalId}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
            } else {
                console.error('Error:', err);
            }
        }
    }

    static async updateRelocatedAnimal(animalId: number, pastureId: string) {
        const data = {
            animalId: animalId,
            pastureId: pastureId,
        };
        try {
            // Send data to the backend using axios
            await axios.put(`http://localhost:3000/api/animals/relocateAnimal`, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
            } else {
                console.error('Error:', err);
            }
        }
    }
}

export default AnimalApi