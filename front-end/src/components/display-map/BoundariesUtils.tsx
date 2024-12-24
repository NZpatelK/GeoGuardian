import { markerIcon } from "../../assets/markerIcon.";
import FieldApi from "../../services/FieldApi";

let polygonCoordinates: { lat: number; lng: number }[] = [];
let temporaryPolyline: null = null;
let temporaryMarker: null = null;
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

export const createMarker = (coords: { lat: number; lng: number }) => {
    return new H.map.Marker(
        { lat: coords.lat, lng: coords.lng },
        { icon: markerIcon }
    );
}

export const getSpecifcPolygonCoordinates = (index: number) => {
    return polygonCoordinates[index];
}

export const startPolygon = (coords: { lat: number; lng: number }) => {
    polygonCoordinates = [{ lat: coords.lat, lng: coords.lng }];

    temporaryMarker = createMarker(coords);

    return temporaryMarker;
}

export const closePolygon = (startPoint: { lat: number; lng: number }) => {
    polygonCoordinates.push(startPoint);

    const { removeTempPolyline, removeTempMarker } = cleanupTemporaryObjects();

    const lineString = createLineString(polygonCoordinates);

    polygon = new H.map.Polygon(lineString, {
        style: { fillColor: 'rgba(0, 128, 255, 0.4)', strokeColor: 'blue', lineWidth: 2 },
    });

    const area = calculateGeodeticAreaInSquareKilometers(polygonCoordinates);
    console.log('Area:', area);

    CompletedPolygon = [];
    CompletedPolygon = polygonCoordinates;
    FieldApi.addField(polygonCoordinates);
    polygonCoordinates = [];

    return { removeTempPolyline, removeTempMarker, polygon };
}

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
    });

    const addTempPolyline = temporaryPolyline;

    if (temporaryMarker) {
        removeTempMarker = temporaryMarker;
    }

    temporaryMarker = createMarker(coords);
    const addTempMarker = temporaryMarker;

    return { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker };
}

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

function createLineString(coordinates: { lat: number; lng: number }[]) {
    const lineString = new H.geo.LineString();
    coordinates.forEach((coord) => lineString.pushLatLngAlt(coord.lat, coord.lng));
    return lineString;
}

export const createLabel = (labelName: string) => {
    const centroid = calculateCentroid();

    const labelIcon = new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40">
          <rect x="0" y="0" width="120" height="40" fill="#FFFFFF" stroke="#000000" stroke-width="2" rx="5" ry="5" />
          <text x="60" y="25" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle" fill="#000000">
            ${labelName}
          </text>
        </svg>`,
        { size: { w: 120, h: 40 }, anchor: { x: 60, y: 20 } } // Anchor at the center of the label
    );

    const label = new H.map.Marker(
        { lat: centroid.lat, lng: centroid.lng }, // Coordinates
        { icon: labelIcon } // Custom icon
    );

    return label
}

