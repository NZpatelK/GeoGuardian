import AnimalApi from "../../services/AnimalApi";
import PasturesApi from "../../services/PasturesApi";
import { isPointInPolygon } from "./BoundariesUtils";

import { Animal } from "../../types/animal";
import { Pasture, Coordinate } from "../../types/pasture";

interface PastureCoord {
    coordinates: Coordinate[];
}

const MOVE_INCREMENT = 0.001;

let animals: Animal[] = [];

export class AnimalUtils {

    /**
     * @description Initializes the animals by fetching their coordinates from the API.
     * @returns {Promise<Animal[]>} A promise that resolves to the list of animals.
     */
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

    static getAnimalsByPastureId = (pastureId: string) => {
        return animals.filter(animal => animal.pastureId === pastureId);
    }

    static hasAnimalsInPasture = (pastureId: string): boolean => {
        return animals.some(animal => animal.pastureId === pastureId);
    }

    static addAnimal = async (animal: Animal) => {
        const newAnimal = await AnimalApi.addAnimal(animal);
        animals.push(newAnimal.animal);
        return newAnimal.animal;
    }

    static updateAnimal = (id: number, newCoordinates: { lat: number, lng: number }) => {
        const index = animals.findIndex(animal => animal.id === id);
        animals[index].coordinates = newCoordinates;
        AnimalApi.updateAnimalCoordinates(id, newCoordinates)
    }

    static updateAnimalPasture = (id: number, newPastureId: string) => {
        const index = animals.findIndex(animal => animal.id === id);
        animals[index].pastureId = newPastureId;
        AnimalApi.updateRelocatedAnimal(id, newPastureId);
    }

    static removeAnimal = (id: number) => {
        const index = animals.findIndex(animal => animal.id === id);
        if (index !== -1) {
            animals.splice(index, 1);
            AnimalApi.removeAnimal(id);
        }
    }

    /**
     * @description Randomly moves an animal within a small range of its current coordinates.
     * @param {Animal} animal - The animal to be moved.
     * @returns {Object} An object containing the updated animal's id, name, and new coordinates.
     */
    static randomiseAnimalCoordinates = (animal: Animal) => {

        // Generate new random lat/lng within a small range
        const newLat = animal.coordinates.lat + (Math.random() - 1.5) * MOVE_INCREMENT;
        const newLng = animal.coordinates.lng + (Math.random() - 1.5) * MOVE_INCREMENT;

        const coordinates = { lat: newLat, lng: newLng };

        AnimalUtils.updateAnimal(animal.id, coordinates);

        return { id: animal.id, name: animal.name, coordinates: coordinates };
    }

    /**
     * @description Gets a random position inside the pasture for the given animal.
     * @param {Animal} animal - The animal for which to find a new position.
     * @returns {Promise<Object>} An object containing the animal's id, name, and new coordinates.
     */
    static getRandomPositionInsidePasture = async (animal: Animal) => {
        if (!animal) return;
        const pasture: Pasture = await PasturesApi.getPastureById(animal.pastureId);
        if (!pasture) return;
        const pastureCoordinates = pasture.coordinates;
        const animalCoordinates = animal.coordinates;

        for (let attempt = 0; attempt < 100; attempt++) {
            const angle = Math.random() * 2 * Math.PI;
            const newLat = animalCoordinates.lat + Math.sin(angle) * MOVE_INCREMENT;
            const newLng = animalCoordinates.lng + Math.cos(angle) * MOVE_INCREMENT;

            if (isPointInPolygon({ lat: newLat, lng: newLng }, pastureCoordinates)) {
                AnimalUtils.updateAnimal(animal.id, { lat: newLat, lng: newLng });
                return { id: animal.id, name: animal.name, coordinates: { lat: newLat, lng: newLng } };
            }
        }


        return { id: animal.id, name: animal.name, coordinates: animalCoordinates };
    }

    /**
     * @description Checks if the animal is inside its pasture.
     * @param {number} animalId - The ID of the animal to check.
     * @returns {Promise<boolean>} A promise that resolves to true if the animal is inside the pasture, false otherwise.
     */
    static checkAnimalInPasture = async (animalId: number) => {
        const animal = animals.find(animal => animal.id === animalId);
        if (!animal) return;
        const pasture: Pasture = await PasturesApi.getPastureById(animal.pastureId);
        if (!pasture) return;
        const pastureCoordinates = pasture.coordinates;
        const animalCoordinates = animal.coordinates;
        const isInside = isPointInPolygon(animalCoordinates, pastureCoordinates);
        return isInside;

    }

    /**
     * @description Updates the polygon state and generates a notification message if the animal enters or exits a pasture.
     * @param {Object} animalData - The animal data containing id, name, and coordinates.
     * @param {Object} polygonState - The current state of the polygons.
     * @returns {Promise<Object>} An object containing the notification message and updated polygon state.
     */
    static updatePolygonStateAndGenerateNotification = async (animalData: { id: number, name: string, coordinates: { lat: number, lng: number } }, polygonState: Record<string, Record<number, boolean>>) => {

        const listPastures = await PasturesApi.getPasturesCoordinates();
        let notificationMsg = "";

        listPastures.forEach((pasture: Pasture) => {
            const isInside = isPointInPolygon(animalData.coordinates, pasture.coordinates);
            const previousState = polygonState[pasture.name]?.[animalData.id] ?? false;

            // Handle Enter event
            if (isInside && !previousState) {
                notificationMsg = (`${animalData.name} - ${animalData.id} Entered ${pasture.name}`);
            }

            // Handle Exit event
            if (!isInside && previousState) {
                notificationMsg = (`${animalData.name} - ${animalData.id} Exited ${pasture.name} `);
            }

            // Update the polygonState
            polygonState[pasture.name] = {
                ...(polygonState[pasture.name] || {}),
                [animalData.id]: isInside, // Track the state per location
            };
        });

        return { notificationMsg: notificationMsg, polygonState: polygonState };
    };

    /**
     * @description Moves an animal back to the closest boundary point of its pasture.
     * @param {number} animalId - The ID of the animal to be moved.
     * @returns {Promise<Coordinates>} The new coordinates of the animal after moving it back to the pasture boundary.
     */
    static moveAnimalBackToTheirPasture = async (animalId: number): Promise<Coordinates> => {
        const animal = animals.find(animal => animal.id === animalId);

        if (!animal) return { lat: 0, lng: 0 };
        const animalLocation = animal.coordinates;

        const pasture = await PasturesApi.getPastureById(animal.pastureId);
        if (!pasture) return animalLocation;

        const pastureCoordinates: PastureCoord = pasture;

        let minDistance = Infinity;
        let closestBoundaryPoint: Coordinates = animalLocation;

        for (let i = 0; i < pastureCoordinates.coordinates.length; i++) {
            const pointA = pastureCoordinates.coordinates[i];
            const pointB = pastureCoordinates.coordinates[(i + 1) % pastureCoordinates.coordinates.length];

            const deltaX1 = animalLocation.lat - pointA.lat;
            const deltaY1 = animalLocation.lng - pointA.lng;
            const deltaX2 = animalLocation.lat - pointB.lat;
            const deltaY2 = animalLocation.lng - pointB.lng;

            const projectionScalar = deltaX1 * deltaX2 + deltaY1 * deltaY2;
            const segmentLengthSquared = deltaX2 * deltaX2 + deltaY2 * deltaY2;
            const projectionFactor = segmentLengthSquared === 0 ? -1 : projectionScalar / segmentLengthSquared;

            let projectedPoint: Coordinates;

            if (projectionFactor < 0) {
                projectedPoint = pointA;
            } else if (projectionFactor > 0) {
                projectedPoint = pointB;
            } else {
                projectedPoint = { lng: pointA.lng + projectionFactor * deltaX2, lat: pointA.lat + projectionFactor * deltaY2 };
            }

            const diffX = animalLocation.lng - projectedPoint.lng;
            const diffY = animalLocation.lat - projectedPoint.lat;
            const computedDistance = Math.sqrt(diffX * diffX + diffY * diffY);

            if (computedDistance < minDistance) {
                minDistance = computedDistance;
                closestBoundaryPoint = projectedPoint;
            }
        }

        const moveX = closestBoundaryPoint.lng - animalLocation.lng;
        const moveY = closestBoundaryPoint.lat - animalLocation.lat;
        const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

        if (moveDistance < MOVE_INCREMENT) {
            return closestBoundaryPoint;
        }

        const stepLongitude = (moveX / moveDistance) * MOVE_INCREMENT;
        const stepLatitude = (moveY / moveDistance) * MOVE_INCREMENT;

        AnimalUtils.updateAnimal(animalId, { lat: animalLocation.lat + stepLatitude, lng: animalLocation.lng + stepLongitude });

        return { lng: animalLocation.lng + stepLongitude, lat: animalLocation.lat + stepLatitude };
    }

    /**
     * @description Controls the movement of animals by randomly selecting one and updating its position.
     * @returns {Promise<void>}
     */
    static controlAnimalMovement = async () => {
        const randomIndex = Math.floor(Math.random() * animals.length);
        const animal = animals[randomIndex];

        const randomMovementType = Math.random(); // Generates a number between 0 and 1

        if (randomMovementType < 0.8) {
            // 80% chance: Move inside pasture
            return await AnimalUtils.getRandomPositionInsidePasture(animal);
        } else {
            // 20% chance: Random movement
            return AnimalUtils.randomiseAnimalCoordinates(animal);
        }
    }
}

export default AnimalUtils;