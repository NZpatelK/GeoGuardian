import { markerIcon } from "../../assets/markerIcon.";

let polygonCoordinates: { lat: number; lng: number }[] = [];
let temporaryPolyline: null = null;
let temporaryMarker: null = null;
let polygon = null;

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
