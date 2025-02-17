import AnimalApi from "../../services/AnimalApi";
import PasturesApi from "../../services/PasturesApi";
import { isPointInPolygon } from "./BoundariesUtils";

interface Animal {
    id: number;
    name: string;
    type: string;
    pastureId: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

interface Pasture {
    id: string;
    name: string;
    coordinates: Coordinates[];
}

interface Coordinates {
    lat: number;
    lng: number;
}

interface PastureCoord {
    coordinates: Coordinates[];
}

const MOVE_INCREMENT = 0.001;

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

    static randomiseAnimalCoordinates = (animal: Animal) => {

        // Generate new random lat/lng within a small range
        const newLat = animal.coordinates.lat + (Math.random() - 1.5) * MOVE_INCREMENT;
        const newLng = animal.coordinates.lng + (Math.random() - 1.5) * MOVE_INCREMENT;

        const coordinates = { lat: newLat, lng: newLng };

        AnimalUtils.updateAnimal(animal.id, coordinates);

        return { id: animal.id, name: animal.name, coordinates: coordinates };
    }

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
                AnimalUtils.updateAnimal(animal.id, {lat: newLat, lng: newLng });
                return { id: animal.id, name: animal.name, coordinates: { lat: newLat, lng: newLng } };
            }
        }


        return { id: animal.id, name: animal.name, coordinates: animalCoordinates };
    }

    static checkAnimalInPasture = async (animalId: number) => {
        const animal = animals.find(animal => animal.id === animalId);
        if (!animal) return;
        const pasture: Pasture = await PasturesApi.getPastureById(animal.pastureId);
        if (!pasture) return;
        const pastureCoordinates = pasture.coordinates;
        const animalCoordinates = animal.coordinates;
        const isInside = isPointInPolygon(animalCoordinates, pastureCoordinates);
        // console.log(`Animal ${animalId} is inside pasture ${pasture.name}: ${isInside}`);
        return isInside;

    }

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

    static controlAnimalMovement = async () => {
        const randomIndex = Math.floor(Math.random() * animals.length);
        const animal = animals[randomIndex];

        const randomMovementType = Math.floor(Math.random() * 2);

        switch (randomMovementType) {
            case 0:
                // Random movement
                // console.log('Random movement');
                return AnimalUtils.randomiseAnimalCoordinates(animal);
            default:
                // Random movement inside pasture
                // console.log('Random movement inside pasture');
                return await AnimalUtils.getRandomPositionInsidePasture(animal);
        }
    }
}

export default AnimalUtils;