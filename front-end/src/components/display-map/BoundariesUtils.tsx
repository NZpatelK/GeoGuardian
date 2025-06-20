import { Map as HMap } from "@here/maps-api-for-javascript";
import { labelIcon, markerIcon } from "../../assets/Icon";
import PasturesApi from "../../services/PasturesApi";
import { Pasture } from "../../types/pasture";

const listPastures: Pasture[] = [];
let pastureCoordinates: { lat: number; lng: number }[] = [];
let temporaryPolyline: H.map.Polyline | null = null;
let temporaryMarker: H.map.Marker | null = null;
let CompletedPolygon: { lat: number; lng: number }[] = [];
let polygon = null;


export const getPastures = () => {
    return listPastures;
}

export const checkIfCurrentPolygon = (): boolean => {
    return pastureCoordinates.length > 0;
}

/**
 * Calculates the distance between two geographical points using the Haversine formula.
 * 
 * @param point1 - The first point with latitude and longitude.
 * @param point2 - The second point with latitude and longitude.
 * @returns The distance in meters between the two points on the Earth's surface.
 */
export const calculateDistanceBetweenPoints = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }) => {
    const earthRadius = 6371e3;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const latitude1 = toRadians(point1.lat);
    const latitude2 = toRadians(point2.lat);
    const latitudeDelta = toRadians(point2.lat - point1.lat);
    const longitudeDelta = toRadians(point2.lng - point1.lng);

    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(longitudeDelta / 2) *
        Math.sin(longitudeDelta / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
};

/**
 * Calculates the area of a polygon in square kilometers on the surface of the Earth.
 * 
 * @param pastureCoordinates - The coordinates of the polygon in the format of an array of objects containing 'lat' and 'lng' properties.
 * @returns The area in square kilometers.
 * @throws {Error} If the polygon has fewer than three vertices.
 */
const calculateGeodeticAreaInSquareKilometers = (pastureCoordinates: { lat: number; lng: number }[]): number => {

    const EARTH_RADIUS = 6371000;
    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

    if (pastureCoordinates.length < 3) {
        throw new Error("A polygon must have at least three vertices.");
    }

    let area = 0;
    const n = pastureCoordinates.length;

    for (let i = 0; i < n; i++) {
        const { lat: lat1, lng: lng1 } = pastureCoordinates[i];
        const { lat: lat2, lng: lng2 } = pastureCoordinates[(i + 1) % n];

        // Convert coordinates to radians
        const lat1Rad = toRadians(lat1);
        const lng1Rad = toRadians(lng1);
        const lat2Rad = toRadians(lat2);
        const lng2Rad = toRadians(lng2);

        // Calculate the spherical excess for this segment
        area += (lng2Rad - lng1Rad) * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }

    // Multiply by Earth's radius squared and take the absolute value
    area = Math.abs(area * (EARTH_RADIUS ** 2) / 2);

    // Convert square meters to square kilometers
    return area / 10_000;
};

/**
 * Calculates the centroid of a polygon. The centroid is the average of all the
 * points of the polygon.
 *
 * @returns The centroid of the polygon.
 */
export const calculateCentroid = (coords?: { lat: number; lng: number }[]) => {

    let centroid = { lat: 0, lng: 0 };

    if (coords) {
        centroid = coords.reduce(
            (acc, coord) => ({
                lat: acc.lat + coord.lat / coords.length,
                lng: acc.lng + coord.lng / coords.length,
            }),
            { lat: 0, lng: 0 }
        );
        return centroid;

    }

    centroid = CompletedPolygon.reduce(
        (acc, coord) => ({
            lat: acc.lat + coord.lat / CompletedPolygon.length,
            lng: acc.lng + coord.lng / CompletedPolygon.length,
        }),
        { lat: 0, lng: 0 }
    );

    return centroid;
}

/**
 * Creates a new marker at the specified coordinates.
 *
 * @param coords - The coordinates for the marker in the format of an object containing 'lat' and 'lng' properties.
 * @returns A new marker at the specified coordinates.
 */
export const createMarker = (coords: { lat: number; lng: number }) => {
    return new H.map.Marker(
        { lat: coords.lat, lng: coords.lng },
        { icon: markerIcon, data: {} }
    );
}

/**
 * Returns the coordinates of a specific polygon.
 *
 * @param index - The index of the polygon to be returned.
 * @returns The coordinates of the polygon at the specified index.
 */
export const getSpecifcPolygonCoordinates = (index: number) => {
    return pastureCoordinates[index];
}

/**
 * Starts a new polygon by adding a marker at the specified coordinates. The
 * coordinates will be the first point of the polygon.
 *
 * @param coords - The coordinates for the first point of the polygon in the format of an object containing 'lat' and 'lng' properties.
 * @returns The newly created marker.
 */
export const startPolygon = (coords: { lat: number; lng: number }) => {
    pastureCoordinates = [{ lat: coords.lat, lng: coords.lng }];
    temporaryMarker = createMarker(coords);

    return temporaryMarker;
}

export const closePolygon = async (startPoint: { lat: number; lng: number }, label: string) => {
    pastureCoordinates.push(startPoint);

    if (pastureCoordinates.length < 3) {
        return;
    }

    const { removeTempPolyline, removeTempMarker } = cleanupTemporaryObjects();

    const lineString = createLineString(pastureCoordinates);

    polygon = new H.map.Polygon(lineString, {
        style: { fillColor: 'rgba(0, 128, 255, 0.4)', strokeColor: 'blue', lineWidth: 2 },
        data: {}
    });

    // const area = calculateGeodeticAreaInSquareKilometers(pastureCoordinates);

    // listPastures.push({ label: label, polygon: pastureCoordinates, id: nanoid() });
    CompletedPolygon = [];
    CompletedPolygon = pastureCoordinates;
    const size = calculateGeodeticAreaInSquareKilometers(pastureCoordinates);
    const pastureDetail = await PasturesApi.addPasture(pastureCoordinates, label, size);
    let pastureId;
    if (pastureDetail) {
        listPastures.push(pastureDetail as Pasture);
        pastureId = pastureDetail.id;
    }
    pastureCoordinates = [];


    return { removeTempPolyline, removeTempMarker, polygon, pastureId };
}

/**
 * Creates a new polygon based on the given coordinates and label.
 * This function is used to load existing polygons from the server.
 *
 * @param coords - The coordinates of the polygon in the format of an array of objects containing 'lat' and 'lng' properties.
 * @param label - The label for the polygon.
 * @returns An object containing the newly created H.map.Polygon and H.map.Marker.
 */
// export const addExistingPasture = (coords: { lat: number; lng: number }[], label: string, id: string) => {
export const addExistingPasture = (pasture: Pasture) => {
    const lineString = createLineString(pasture.coordinates);
    const createPasture = new H.map.Polygon(lineString, {
        style: { fillColor: 'rgba(0, 128, 255, 0.4)', strokeColor: 'blue', lineWidth: 2 },
        data: {}
    });

    CompletedPolygon = pasture.coordinates;
    const labelMarker = createLabel(pasture.name);
    CompletedPolygon = [];

    listPastures.push(pasture);
    return { createPasture, labelMarker };
}

/**
 * Adds a point to the current polygon.
 *
 * @param coords - The coordinates of the point to be added in the format of an object containing 'lat' and 'lng' properties.
 * @returns An object containing the following properties:
 *  - removeTempPolyline: The temporary polyline that was previously added to the map, if any.
 *  - removeTempMarker: The temporary marker that was previously added to the map, if any.
 *  - addTempPolyline: The new temporary polyline that has been added to the map.
 *  - addTempMarker: The new temporary marker that has been added to the map.
 */
export const addPointToPolygon = (coords: { lat: number; lng: number }) => {
    pastureCoordinates.push({ lat: coords.lat, lng: coords.lng });

    let removeTempPolyline;
    let removeTempMarker;

    const lineString = createLineString(pastureCoordinates);

    if (temporaryPolyline) {
        removeTempPolyline = temporaryPolyline;
    }

    temporaryPolyline = new H.map.Polyline(lineString, {
        style: { lineWidth: 5, strokeColor: 'blue' },
        data: {}
    });

    const addTempPolyline = temporaryPolyline;

    if (temporaryMarker) {
        removeTempMarker = temporaryMarker;
    }

    temporaryMarker = createMarker(coords);
    const addTempMarker = temporaryMarker;

    return { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker };
}

/**
 * Removes the temporary polyline and marker from the map, if any, and returns them.
 * This function is used to clean up the temporary objects after a polygon has been completed.
 *
 * @returns An object containing the following properties:
 *  - removeTempPolyline: The temporary polyline that was previously added to the map, if any.
 *  - removeTempMarker: The temporary marker that was previously added to the map, if any.
 */
export function cleanupTemporaryObjects(isCleanData?: boolean) {
    let removeTempPolyline;
    let removeTempMarker;

    if (temporaryPolyline) {
        removeTempPolyline = temporaryPolyline;
        temporaryPolyline = null;
    }

    if (temporaryMarker) {
        removeTempMarker = temporaryMarker;
        temporaryMarker = null;
    }

    if (isCleanData) {
        pastureCoordinates = [];
    }

    return { removeTempPolyline, removeTempMarker };
}

/**
 * Creates a LineString from an array of geographical coordinates.
 *
 * @param coordinates - An array of objects, each containing 'lat' and 'lng' properties representing the latitude and longitude of a point.
 * @returns A LineString object representing the path through the given coordinates.
 */
function createLineString(coordinates: { lat: number; lng: number }[]) {
    const lineString = new H.geo.LineString();
    coordinates.forEach((coord) => lineString.pushLatLngAlt(coord.lat, coord.lng, 0));
    return lineString;
}

export const createLabel = (labelName: string) => {
    const centroid = calculateCentroid();

    const newLabelIcon = labelIcon(labelName);

    const label = new H.map.Marker(
        { lat: centroid.lat, lng: centroid.lng }, // Coordinates
        { icon: newLabelIcon, data: {} } // Custom icon
    );

    return label
}

/**
 * Determines if a given point is inside a polygon using the ray-casting algorithm.
 *
 * @param point - The point to check, with latitude and longitude properties.
 * @param pastureCoord - An array of objects representing the vertices of the polygon, each containing 'lat' and 'lng' properties.
 * @returns A boolean indicating whether the point is inside the polygon.
 */
export const isPointInPolygon = (point: { lat: number; lng: number }, pastureCoord: { lat: number; lng: number }[]): boolean => {
    let intersects = 0;

    for (let i = 0; i < pastureCoord.length; i++) {
        const vertex1 = pastureCoord[i];
        const vertex2 = pastureCoord[(i + 1) % pastureCoord.length];

        if (
            ((vertex1.lat > point.lat) !== (vertex2.lat > point.lat)) &&
            (point.lng < (vertex2.lng - vertex1.lng) * (point.lat - vertex1.lat) / (vertex2.lat - vertex1.lat) + vertex1.lng)
        ) {
            intersects++;
        }
    }

    return intersects % 2 === 1;
};

export const updatePolygonState = (animalData: { id: number, name: string, coordinates: { lat: number, lng: number } }, polygonState: Record<string, Record<number, boolean>>) => {
    listPastures.forEach((pasutre) => {
        const isInside = isPointInPolygon(animalData.coordinates, pasutre.coordinates);
        // Update the polygonState
        polygonState[pasutre.name] = {
            ...(polygonState[pasutre.name] || {}),
            [animalData.id]: isInside, // Track the state per location
        };
    });

    return polygonState;
};

export const updatePasture = (points: H.geo.Point[], pasture: H.map.Polygon) => {
    const updatedLineString = new H.geo.LineString();
    points.forEach((p) => updatedLineString.pushPoint(p));
    updatedLineString.pushPoint(points[0]); // Close the shape
    pasture.setGeometry(new H.geo.Polygon(updatedLineString));

    return pasture;
};


export const addNewPoint = (newPoint: H.geo.Point, points: H.geo.Point[], pasture: H.map.Polygon) => {
    let insertIndex = -1;
    let minDistance = Number.MAX_VALUE;

    for (let i = 0; i < points.length - 1; i++) {
        const midPoint = new H.geo.Point(
            (points[i].lat + points[i + 1].lat) / 2,
            (points[i].lng + points[i + 1].lng) / 2
        );

        const distance = Math.hypot(midPoint.lat - newPoint.lat, midPoint.lng - newPoint.lng);
        if (distance < minDistance) {
            minDistance = distance;
            insertIndex = i + 1;
        }
    }

    if (insertIndex === -1) return;

    points.splice(insertIndex, 0, newPoint);
    const updatePoint = [...points];
    // updateMarkers();
    const updatedPasture = updatePasture(points, pasture);

    return { pasture: updatedPasture, points: updatePoint };
}

export const updatePastureDatabase = async (pastureId: string, coord: { lat: number; lng: number }[]) => {

    const pasture = listPastures.find(pasture => pasture.id === pastureId);
    if (!pasture) return;
    pasture.coordinates = coord;

    await PasturesApi.updatePasture(pastureId, coord);

}

export const deletePasture = async (pastureId: string) => {
    const pasture = listPastures.find(pasture => pasture.id === pastureId);
    if (!pasture) return;
    const index = listPastures.indexOf(pasture);
    listPastures.splice(index, 1);
    await PasturesApi.deletePasture(pastureId);
}

