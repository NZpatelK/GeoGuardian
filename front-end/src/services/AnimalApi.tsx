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
}

export default AnimalApi