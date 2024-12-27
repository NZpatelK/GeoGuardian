import { labelIcon, markerIcon } from "../../assets/Icon";
import FieldApi from "../../services/FieldApi";

let polygonCoordinates: { lat: number; lng: number }[] = [];
let temporaryPolyline: H.map.Polyline | null = null;
let temporaryMarker: H.map.Marker | null = null;
let CompletedPolygon: { lat: number; lng: number }[] = [];
let polygon = null;


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
 * @param polygonCoordinates - The coordinates of the polygon in the format of an array of objects containing 'lat' and 'lng' properties.
 * @returns The area in square kilometers.
 * @throws {Error} If the polygon has fewer than three vertices.
 */
const calculateGeodeticAreaInSquareKilometers = (polygonCoordinates: { lat: number; lng: number }[]): number => {

    const EARTH_RADIUS = 6371000;
    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

    if (polygonCoordinates.length < 3) {
        throw new Error("A polygon must have at least three vertices.");
    }

    let area = 0;
    const n = polygonCoordinates.length;

    for (let i = 0; i < n; i++) {
        const { lat: lat1, lng: lng1 } = polygonCoordinates[i];
        const { lat: lat2, lng: lng2 } = polygonCoordinates[(i + 1) % n]; // Wrap around to the first point

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
    return area / 1_000_000; // Area in square kilometers
};

/**
 * Calculates the centroid of a polygon. The centroid is the average of all the
 * points of the polygon.
 *
 * @returns The centroid of the polygon.
 */
const calculateCentroid = () => {
    const centriod = CompletedPolygon.reduce(
        (acc, coord) => ({
            lat: acc.lat + coord.lat / CompletedPolygon.length,
            lng: acc.lng + coord.lng / CompletedPolygon.length,
        }),
        { lat: 0, lng: 0 }
    );

    return centriod;
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
    return polygonCoordinates[index];
}

/**
 * Starts a new polygon by adding a marker at the specified coordinates. The
 * coordinates will be the first point of the polygon.
 *
 * @param coords - The coordinates for the first point of the polygon in the format of an object containing 'lat' and 'lng' properties.
 * @returns The newly created marker.
 */
export const startPolygon = (coords: { lat: number; lng: number }) => {
    polygonCoordinates = [{ lat: coords.lat, lng: coords.lng }];

    temporaryMarker = createMarker(coords);

    return temporaryMarker;
}

export const closePolygon = (startPoint: { lat: number; lng: number }, label: string) => {
    polygonCoordinates.push(startPoint);

    const { removeTempPolyline, removeTempMarker } = cleanupTemporaryObjects();

    const lineString = createLineString(polygonCoordinates);

    polygon = new H.map.Polygon(lineString, {
        style: { fillColor: 'rgba(0, 128, 255, 0.4)', strokeColor: 'blue', lineWidth: 2 },
        data: {}
    });

    // const area = calculateGeodeticAreaInSquareKilometers(polygonCoordinates);

    CompletedPolygon = [];
    CompletedPolygon = polygonCoordinates;
    FieldApi.addField(polygonCoordinates, label);
    polygonCoordinates = [];

    return { removeTempPolyline, removeTempMarker, polygon };
}

/**
 * Creates a new polygon based on the given coordinates and label.
 * This function is used to load existing polygons from the server.
 *
 * @param coords - The coordinates of the polygon in the format of an array of objects containing 'lat' and 'lng' properties.
 * @param label - The label for the polygon.
 * @returns An object containing the newly created H.map.Polygon and H.map.Marker.
 */
export const addExistingPolygon = (coords: { lat: number; lng: number }[], label: string) => {
    const lineString = createLineString(coords);
    const existingPolygon = new H.map.Polygon(lineString, {
        style: { fillColor: 'rgba(0, 128, 255, 0.4)', strokeColor: 'blue', lineWidth: 2 },
        data: {}
    });

    CompletedPolygon = coords;
    const labelMarker = createLabel(label);
    CompletedPolygon = [];

    return { existingPolygon, labelMarker };
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
    polygonCoordinates.push({ lat: coords.lat, lng: coords.lng });

    let removeTempPolyline;
    let removeTempMarker;

    const lineString = createLineString(polygonCoordinates);

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
function cleanupTemporaryObjects() {
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

