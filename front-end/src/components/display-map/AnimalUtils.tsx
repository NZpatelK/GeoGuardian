import AnimalApi from "../../services/AnimalApi";

interface Animal {
    id: number;
    name: string;
    type: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

let animals: Animal[] = [];

export class AnimalUtils {

    static intialiseAnimals = async () => {
        try {
            const response = await AnimalApi.getAnimalsCoordinates();
            animals = response;

            return animals;

        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    static getAnimals = () => {
        return animals;
    }

    static updateAnimal = (id: number, newCoordinates: { lat: number, lng: number }) => {
        const index = animals.findIndex(animal => animal.id === id);
        animals[index].coordinates = newCoordinates;
    }

    static randomiseAnimalCoordinates = () => {
        // Select a random animal
        const randomIndex = Math.floor(Math.random() * animals.length);
        const randomLocation = animals[randomIndex];

        // Generate new random lat/lng within a small range
        const newLat = randomLocation.coordinates.lat + (Math.random() - 0.5) * 0.001;
        const newLng = randomLocation.coordinates.lng + (Math.random() - 0.5) * 0.001;

        const coordinates = { lat: newLat, lng: newLng };

        return {id: randomLocation.id, name: randomLocation.name, coordinates: coordinates};
    }
}

export default AnimalUtils;