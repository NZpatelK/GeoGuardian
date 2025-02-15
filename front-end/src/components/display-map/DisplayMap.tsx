import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon, getPastures, updatePolygonState } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';
import AnimalUtils from './AnimalUtils';

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
  const [displayAnimal, setDisplayAnimal] = useState<Animal[]>([]);
  const isMapLoaded = useRef(false);

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
            const existingPolygon = addExistingPolygon(coord, item.name, item.id);

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
      // const getAnimals = async () => {
      //   try {
      //     const response = await AnimalApi.getAnimalsCoordinates();
      //     setAnimals(() => [...response]);
      //     addExistingAnimalsIntoMap(response);
      //   } catch (err) {
      //     console.error('Error fetching data:', err);
      //   }
      // }

      // getAnimals();
      const initialiseAndAddExistingAnimalsIntoMap = async () => {
        await AnimalUtils.intialiseAnimals()
        const animalData = AnimalUtils.getAnimals();
        if (animalData && animalData.length > 0) {
          const animalPosition: Record<number, H.map.Marker> = {};
          animalData.forEach((animal) => {
            // const newlabel = labelIcon(animal.id.toString());
            // const position = new H.map.Marker(
            //   { lat: animal.coordinates.lat, lng: animal.coordinates.lng }, 
            //   { icon: newlabel, data: {} } );
            const position = new H.map.Marker({ lat: animal.coordinates.lat, lng: animal.coordinates.lng });
            animalPosition[animal.id] = position;
            mapInstance.addObject(position);
          });
          animalRef.current = animalPosition;
        }
        setDisplayAnimal(animalData);
      };
      initialiseAndAddExistingAnimalsIntoMap();
    }
  }, [mapInstance]);


  useEffect(() => {
    /**
     * Periodically updates the animal's location to a new random point within a small range, checks if the new position is inside any polygons, and handles Enter/Exit events accordingly.
     * 
     * @remarks
     * This method is called every 5 seconds to simulate the user's movement.
     */
    const updateAnimalLocation = async() => {
      if (!animalRef.current) return;

      // const updateAnimalPosition = AnimalUtils.randomiseAnimalCoordinates();
      const updateAnimalPosition = await AnimalUtils.getRandomPositionInsidePasture();

      if(!updateAnimalPosition) return; 

      // Update the corresponding animal's position
      const position = animalRef.current[updateAnimalPosition.id];
      if (position) {
        position.setGeometry(new H.geo.Point(updateAnimalPosition.coordinates.lat, updateAnimalPosition.coordinates.lng));
      }


      const latestPolygonState = updatePolygonState(updateAnimalPosition, polygonState);
      setPolygonState(latestPolygonState);
      AnimalUtils.updateAnimal(updateAnimalPosition.id, updateAnimalPosition.coordinates);
      const newDisplayAnimal = AnimalUtils.getAnimals();
      setDisplayAnimal([...newDisplayAnimal]);
    };

    // Set interval for updating user animals
    const interval = setInterval(updateAnimalLocation, 500); // Update every second
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

    const bringAnimalIntoTheirPasture = async () => {
      console.log('entering into their pastures');
      if (!animalRef.current) return;

      const animalData = AnimalUtils.getAnimals();
      const pastures = getPastures();

      for (const animal of animalData) {
        const position = animalRef.current[animal.id];
        const getPasture = pastures.find((pasture) => pasture.id === animal.pastureId);
        if (position) {
          const isAnimalExitedPasture = await AnimalUtils.checkAnimalInPasture(animal.id);
          if (isAnimalExitedPasture) {
            if (getPasture) {
              const newCoord = AnimalUtils.moveAnimalBackToTheirPasture(animal.coordinates, { coordinates: getPasture.polygon });
              position.setGeometry(new H.geo.Point(newCoord.lat, newCoord.lng) );

              AnimalUtils.updateAnimal(animal.id, newCoord);
              const newDisplayAnimal = AnimalUtils.getAnimals();
              setDisplayAnimal([...newDisplayAnimal]);
            }
          }
        }
      }
    };

    // bringAnimalIntoTheirPasture();
    // const interval = setInterval(bringAnimalIntoTheirPasture, 10000); // Update every second
    // return () => clearInterval(interval);

  }, []);

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
          {displayAnimal.map((location) => (
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

