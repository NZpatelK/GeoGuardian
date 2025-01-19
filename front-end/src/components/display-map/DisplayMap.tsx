import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon, isPointInPolygon, getPastures } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import AnimalApi from '../../services/AnimalApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';

interface Animal {
  id: number;
  name: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const DisplayMap = () => {
  const mapRef = useRef(null);
  const animalRef = useRef<Record<number, H.map.Marker>>({});
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [polygonState, setPolygonState] = useState<Record<string, Record<number, boolean>>>({});
  const isMapLoaded = useRef(false);

  const [animals, setAnimals] = useState<Animal[]>([]);


  useEffect(() => {
    /**
     * Initializes the HERE map with default settings and pastures.
     * 
     * This function sets up the map using the HERE Maps API, and enables map events and UI controls.
     * It loads existing pastures from the API and adds them to the map. The map also listens for
     * user interactions to allow drawing new polygons (pastures) by tapping on the map.
     * 
     * Pre-requisites:
     * - The HERE Maps API key should be set in the environment variables.
     * 
     * Behavior:
     * - If the map has not been initialized, it sets the map center and zoom level.
     * - Loads and displays existing pastures as polygons with labels.
     * - Allows users to draw new polygons by tapping on the map, prompting for a name when completing a polygon.
     * - Handles the addition and removal of temporary map objects while drawing.
     * - Logs the current zoom level when the map view changes.
     * 
     * Returns:
     * - A cleanup function to dispose of the map when it's no longer needed.
     */

    const initializeMap = async () => {

      if (!mapRef.current || isMapLoaded.current) return;
      isMapLoaded.current = true;

      const HereApiKey = import.meta.env.VITE_HERE_API_KEY; // Load API key from .env

      if (!HereApiKey) {
        console.error("HERE Maps API key is missing!");
        return;
      }

      const platform = new H.service.Platform({
        apikey: HereApiKey,
      });

      const defaultLayers = platform.createDefaultLayers() as any;

      // Initialize the map
      const hereMap: HMap | null = mapRef.current
        ? new H.Map(
          mapRef.current,
          defaultLayers.vector.normal.map,
          {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 15,
            pixelRatio: window.devicePixelRatio || 1,
          }
        )
        : null;

      if (hereMap) {
        // Enable map events
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(hereMap));

        // Add UI controls
        const ui = H.ui.UI.createDefault(hereMap, defaultLayers);

        // ---------------------------------------------------------------------------------------------------------------------------//

        let isDrawing = false;
        const existPasturesCoordinates: any = await PasturesApi.getPasturesCoordinates();

        if (existPasturesCoordinates) {
          for (const item of existPasturesCoordinates) {
            const coord = item.coordinates as { lat: number; lng: number }[];
            const existingPolygon = addExistingPolygon(coord, item.name);

            hereMap.addObject(existingPolygon.existingPolygon);
            hereMap.addObject(existingPolygon.labelMarker);
          }
        }

        hereMap.addEventListener("tap", (evt: any) => {
          const coords = hereMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (!isDrawing) {
            const tempMarker = startPolygon(coords as { lat: number; lng: number });
            isDrawing = true;

            hereMap.addObject(tempMarker as H.map.Marker);
          } else {
            const startPoint = getSpecifcPolygonCoordinates(0);
            const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords as { lat: number; lng: number });

            if (distanceToStart < 10) {
              const inputName = prompt("Please enter the name of the pasture:");

              const result = closePolygon(startPoint as { lat: number; lng: number }, inputName as string);

              if (result) {
                const { removeTempPolyline, removeTempMarker, polygon } = result;
                if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
                if (removeTempMarker) hereMap.removeObject(removeTempMarker);
                hereMap.addObject(polygon);
              }

              const label = createLabel(inputName as string);
              hereMap.addObject(label);

              isDrawing = false;

            } else {
              const { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords as { lat: number; lng: number });

              if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
              if (removeTempMarker) hereMap.removeObject(removeTempMarker);
              hereMap.addObject(addTempPolyline as H.map.Polyline);
              hereMap.addObject(addTempMarker as H.map.Marker);
            }
          }
        });

        hereMap.addEventListener('mapviewchangeend', () => {
          const zoom = hereMap.getZoom();
          console.log(zoom);
        });

        setMapInstance(hereMap);

        return () => {
          hereMap.dispose();
        };
      };
    }
    initializeMap();
  }, []);


  useEffect(() => {
    if (mapInstance) {
      // const existPasturesCoordinates: any = await PasturesApi.getPasturesCoordinates();
      const getAnimals = async () => {
        try {
          const response = await AnimalApi.getAnimalsCoordinates();
          setAnimals(() => [...response]);
          addExistingAnimalsIntoMap(response);
        } catch (err) {
          console.error('Error fetching data:', err);
        }
      }

      getAnimals();
      const addExistingAnimalsIntoMap = (animalData: Animal[]) => {
        if (animalData && animalData.length > 0) {
          const animalPosition: Record<number, H.map.Marker> = {};
          animalData.forEach((animal) => {
            const position = new H.map.Marker({ lat: animal.coordinates.lat, lng: animal.coordinates.lng });
            animalPosition[animal.id] = position;
            mapInstance.addObject(position);
          });
          animalRef.current = animalPosition;
        }
      };
    }
  }, [mapInstance]);

  useEffect(() => {
    /**
     * Periodically updates the animal's location to a new random point within a small range, checks if the new position is inside any polygons, and handles Enter/Exit events accordingly.
     * 
     * @remarks
     * This method is called every 5 seconds to simulate the user's movement.
     */
    const updateUserLocation = () => {
      if (!animalRef.current) return;

      // Select a random animal
      const randomIndex = Math.floor(Math.random() * animals.length);
      const randomLocation = animals[randomIndex];

      // Generate new random lat/lng within a small range
      const newLat = randomLocation.coordinates.lat + (Math.random() - 0.5) * 0.001;
      const newLng = randomLocation.coordinates.lng + (Math.random() - 0.5) * 0.001;

      // Update the corresponding animal's position
      const position = animalRef.current[randomLocation.id];
      if (position) {
        position.setGeometry(new H.geo.Point(newLat, newLng));
      }

      // Check if the new position is inside any polygons
      const currentPoint = { lat: newLat, lng: newLng };
      const polygonData = getPastures();

      polygonData.forEach((polygon) => {
        const isInside = isPointInPolygon(currentPoint, polygon.polygon);
        const previousState = polygonState[polygon.label]?.[randomLocation.id] ?? false;

        // Handle Enter event
        if (isInside && !previousState) {
          console.log(`${randomLocation.name} - ${randomLocation.id} Entered ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
        }

        // Handle Exit event
        if (!isInside && previousState) {
          console.log(`${randomLocation.name} - ${randomLocation.id} Exited ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
        }

        // Update the polygon state for this location
        setPolygonState((prevState) => ({
          ...prevState,
          [polygon.label]: {
            ...(prevState[polygon.label] || {}),
            [randomLocation.id]: isInside, // Track the state per location
          },
        }));
      });

      // Update the selected location in the state
      setAnimals((prevLocations) =>
        prevLocations.map((location) =>
          location.id === randomLocation.id
            ? { ...location, lat: newLat, lng: newLng }
            : location
        )
      );
    };

    // Set interval for updating user animals
    const interval = setInterval(updateUserLocation, 500); // Update every second
    return () => clearInterval(interval);
  }, [animals, polygonState]);





  // useEffect(() => {
  // if (mapInstance && marker) {
  // // Simulated user location updates
  // const userMarker = marker;
  // mapInstance.addObject(marker);

  // const polygonState: Record<string, boolean> = {};

  // const updateUserLocation = () => {
  //   // Simulate random movement
  //   const geometry = marker.getGeometry() as H.geo.Point;

  //   const newLat = geometry.lat + (Math.random() - 0.5) * 0.01;
  //   const newLng = geometry.lng + (Math.random() - 0.5) * 0.01;

  //   userMarker.setGeometry({ lat: newLat, lng: newLng });
  //   setMarker(userMarker);

  //   const currentPoint = { lat: newLat, lng: newLng };
  //   const polygonData = getPastures();

  //   polygonData.forEach((polygon) => {
  //     const isInside = isPointInPolygon(currentPoint, polygon.polygon);

  //     if (isInside && !polygonState[polygon.label]) {
  //       alert(`Entered ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  //       polygonState[polygon.label] = true;

  //     } else if (!isInside && polygonState[polygon.label]) {
  //       alert(`Exited ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  //       polygonState[polygon.label] = false;

  //     }
  //   });
  // };

  // const interval = setInterval(updateUserLocation, 1000);

  // return () => clearInterval(interval);
  // }
  // }, [mapInstance, marker]);

  //---------------------------------------------------------------------------------------------------------------------------//

  // const updateUserLocation = () => {
  //   if (mapInstance && marker) {
  //     const userMarker = marker;

  //     // Simulate random movement
  //     // const geometry = marker.getGeometry() as H.geo.Point;

  //     // const newLat = geometry.lat + (Math.random() - 0.5) * 0.001;
  //     // const newLng = geometry.lng + (Math.random() - 0.5) * 0.001;

  //     // Update user's simulated location
  //     const newLat = currentPosition.lat;
  //     const newLng = currentPosition.lng;

  //     userMarker.setGeometry({ lat: newLat, lng: newLng });
  //     setMarker(userMarker);

  //     const currentPoint = { lat: newLat, lng: newLng };
  //     const polygonData = getPastures();

  //     polygonData.forEach((polygon) => {
  //       const isInside = isPointInPolygon(currentPoint, polygon.polygon);

  //       const previousState = polygonState[polygon.label] || false;

  //       if (isInside && !previousState) {
  //         alert(`Entered ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  //         setPolygonState((prevState) => ({ ...prevState, [polygon.label]: true }));
  //       } else if (!isInside && previousState) {
  //         alert(`Exited ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  //         setPolygonState((prevState) => ({ ...prevState, [polygon.label]: false }));
  //       }
  //     });
  //   }
  // };

  return (
    <div
      ref={mapRef}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    >
      <Modal>
        <div className="modal-content">
          {/* <div className="lat-input input-container">
            <h3> Latitude</h3>
            <input type="number" step="0.0001" value={currentPosition.lat} onChange={(e) => setCurrentPosition({ ...currentPosition, lat: parseFloat(e.target.value) })} />
          </div>
          <div className="lng-input input-container">
            <h3> Longitude</h3>
            <input type="number" step="0.0001" value={currentPosition.lng} onChange={(e) => setCurrentPosition({ ...currentPosition, lng: parseFloat(e.target.value) })} />
          </div>
          <button onClick={updateUserLocation}>
            Update User Location
          </button> */}
          {animals.map((location) => (
            <div key={location.id} className="location-item">
              <h3>{location.name} - {location.id} </h3>
              <p>Type: {location.type}</p>
              <p>Latitude: {location.coordinates.lat.toFixed(5)}</p>
              <p>Longitude: {location.coordinates.lng.toFixed(5)}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

