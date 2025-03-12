import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Font Awesome icon
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPasture, getPastures, updatePolygonState, createMarker, updatePasturePoint } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';
import AnimalUtils from './AnimalUtils';
import { labelIcon } from '../../assets/Icon';

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

export const DisplayMap = () => {
  const mapRef = useRef(null);
  const animalRef = useRef<Record<number, H.map.Marker>>({});
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [polygonState, setPolygonState] = useState<Record<string, Record<number, boolean>>>({});
  const [displayAnimal, setDisplayAnimal] = useState<Animal[]>([]);
  const [selectedPasture, setSelectedPasture] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
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
            const existingPasture = addExistingPasture(coord, item.name, item.id);

            let tapDisabled = false; // Flag to track if tap is disabled

            existingPasture.pasture.addEventListener('tap', () => {
              if (tapDisabled) return; // Prevent further tap events if disabled

              console.log("Selected pasture:", existingPasture.pasture);

              const markers = selectPasture(existingPasture.pasture, hereMap, behavior);

              if (markers) {
                for (const marker of markers) {
                  hereMap.addObject(marker);
                }
              }



              // Disable the tap for 1000ms (1 second)
              tapDisabled = true;
              setTimeout(() => {
                tapDisabled = false; // Re-enable tap after 1000ms
              }, 1000);
            });


            hereMap.addObject(existingPasture.pasture);
            hereMap.addObject(existingPasture.labelMarker);
          }
        }

        hereMap.addEventListener("tap", async (evt: any) => {
          if (!isEditMode) return;
          const coords = hereMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (!coords) return;
          isDrawing = await createNewPasture(coords, hereMap, isDrawing);

          // if (!isDrawing) {
          //   const tempMarker = startPolygon(coords as { lat: number; lng: number });
          //   isDrawing = true;

          //   hereMap.addObject(tempMarker as H.map.Marker);
          // } else {
          //   const startPoint = getSpecifcPolygonCoordinates(0);
          //   const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords as { lat: number; lng: number });

          //   if (distanceToStart < 10) {
          //     const inputName = prompt("Please enter the name of the pasture:");

          //     const result = await closePolygon(startPoint as { lat: number; lng: number }, inputName as string);

          //     if (result) {
          //       const { removeTempPolyline, removeTempMarker, polygon } = result;
          //       if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
          //       if (removeTempMarker) hereMap.removeObject(removeTempMarker);
          //       hereMap.addObject(polygon);
          //     }

          //     const label = createLabel(inputName as string);
          //     hereMap.addObject(label);

          //     isDrawing = false;

          //   } else {
          //     const { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords as { lat: number; lng: number });

          //     if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
          //     if (removeTempMarker) hereMap.removeObject(removeTempMarker);
          //     hereMap.addObject(addTempPolyline as H.map.Polyline);
          //     hereMap.addObject(addTempMarker as H.map.Marker);
          //   }
          // }
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
      const initialiseAndAddExistingAnimalsIntoMap = async () => {
        await AnimalUtils.intialiseAnimals()
        const animalData = AnimalUtils.getAnimals();
        if (animalData && animalData.length > 0) {
          const animalPosition: Record<number, H.map.Marker> = {};
          animalData.forEach((animal) => {
            const newlabel = labelIcon(animal.id.toString());
            const position = new H.map.Marker(
              { lat: animal.coordinates.lat, lng: animal.coordinates.lng },
              { icon: newlabel, data: {} });
            // const position = new H.map.Marker({ lat: animal.coordinates.lat, lng: animal.coordinates.lng });
            animalPosition[animal.id] = position;
            mapInstance.addObject(position);
            setPolygonState(updatePolygonState(animal, polygonState));
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
     * Updates the location of animals on the map at regular intervals.
     *
     * This function continuously updates the positions of animals on the map by checking
     * their movement and ensuring they remain within designated pastures. If an animal
     * moves outside its pasture, it attempts to move it back, updating the map and
     * notifying the user if the animal enters or exits a pasture.
     *
     * Behavior:
     * - Retrieves the current animal position and updates its marker on the map.
     * - Checks if the animal is inside its pasture and attempts to move it back if not.
     * - Generates notifications for entry and exit events.
     * - Logs a warning if an animal is unable to return to its pasture after multiple attempts.
     *
     * Pre-requisites:
     * - An initialized map instance with animal markers.
     * - AnimalUtils must provide methods for controlling animal movement, checking pasture status,
     *   and updating polygon states.
     *
     * Returns:
     * - Continuously updates the animal markers on the map until the component is unmounted.
     */
    const updateAnimalLocation = async () => {
      if (!animalRef.current) return;

      const updateAnimalPosition = await AnimalUtils.controlAnimalMovement();

      if (!updateAnimalPosition) return;

      // Update the corresponding animal's position
      const position = animalRef.current[updateAnimalPosition.id];
      if (position) {
        position.setGeometry(new H.geo.Point(updateAnimalPosition.coordinates.lat, updateAnimalPosition.coordinates.lng));
      }

      let isInside = await AnimalUtils.checkAnimalInPasture(updateAnimalPosition.id);

      let attempts = 0;
      const maxAttempts = 100;  // Prevent infinite loop

      while (!isInside && attempts < maxAttempts) {
        const updatePolygonState = await AnimalUtils.updatePolygonStateAndGenerateNotification(updateAnimalPosition, polygonState);

        setPolygonState(updatePolygonState.polygonState);

        if (updatePolygonState.notificationMsg) {
          toast(updatePolygonState.notificationMsg, {
            type: updatePolygonState.notificationMsg.includes("Entered") ? "success" : "error",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const updateAnimalCoord = await AnimalUtils.moveAnimalBackToTheirPasture(updateAnimalPosition.id);
        updateAnimalPosition.coordinates = updateAnimalCoord;
        position.setGeometry(new H.geo.Point(updateAnimalCoord.lat, updateAnimalCoord.lng));
        isInside = await AnimalUtils.checkAnimalInPasture(updateAnimalPosition.id);
        attempts++;
      }

      if (attempts >= maxAttempts) {
        toast.error(`${updateAnimalPosition.id} - ${updateAnimalPosition.name} might be stuck`, {
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          icon: <FontAwesomeIcon icon={faExclamationTriangle} size="lg" color="white" />,
          progress: undefined,
          style: {
            backgroundColor: "red",
            color: "white",
            fontWeight: "bold",
          },
        });
      }

      const newDisplayAnimal = AnimalUtils.getAnimals();
      setDisplayAnimal([...newDisplayAnimal]);
    };

    // Set interval for updating user animals
    const interval = setInterval(updateAnimalLocation, 500); // Update every second
    return () => clearInterval(interval);
  }, []);


  const createNewPasture = async (coords: { lat: number; lng: number }, hereMap: HMap, isDrawing: boolean) => {
    if (!isDrawing) {
      const tempMarker = startPolygon(coords as { lat: number; lng: number });
      isDrawing = true;

      hereMap.addObject(tempMarker as H.map.Marker);
    } else {
      const startPoint = getSpecifcPolygonCoordinates(0);
      const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords as { lat: number; lng: number });

      if (distanceToStart < 10) {
        const inputName = prompt("Please enter the name of the pasture:");

        const result = await closePolygon(startPoint as { lat: number; lng: number }, inputName as string);

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

    return isDrawing;
  }

  const selectPasture = (pasture: H.map.Polygon, hereMap: HMap, behavior: H.mapevents.Behavior) => {
    if (!pasture || !hereMap) return;

    const geometry = pasture.getGeometry() as H.geo.Polygon;
    const exterior = geometry.getExterior();
    const markers: H.map.Marker[] = [];

    // Extract all points except the duplicate last one
    const points: H.geo.Point[] = [];
    for (let i = 0; i < exterior.getPointCount(); i++) {
      points.push(exterior.extractPoint(i));
    }

    // Function to update pasture geometry
    const updatePasture = () => {
      const updatedLineString = new H.geo.LineString();
      points.forEach((p) => updatedLineString.pushPoint(p));
      updatedLineString.pushPoint(points[0]); // Close the shape

      pasture.setGeometry(new H.geo.Polygon(updatedLineString));
    };

    // Create markers for each unique point
    points.forEach((point, i) => {
      const marker = createMarker(point);
      marker.draggable = true;

      // Hide the last marker (but keep it functional)
      if (i === points.length - 1) {
        marker.setVisibility(false);
      }

      marker.addEventListener("dragstart", () => {
        if (behavior) behavior.disable();
      });

      marker.addEventListener("drag", (ev) => {
        if (!hereMap) return;
        // Get new position
        const newPoint = hereMap.screenToGeo(ev.currentPointer.viewportX, ev.currentPointer.viewportY);
        if (!newPoint) return;
        // Update point in array
        points[i] = newPoint;
        // Ensure first and last point remain the same
        if (i === 0) points[points.length - 1] = newPoint;
        if (i === points.length - 1) points[0] = newPoint;
        // Update marker positon
        marker.setGeometry(newPoint);
        // Update pasture geometry
        updatePasture();
      });

      marker.addEventListener("dragend", () => {
        if (behavior) behavior.enable();
      });

      hereMap.addObject(marker);
      markers.push(marker);
    });

    return markers;
  };






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
          {displayAnimal.map((animal) => (
            <div key={animal.id} className="animal-item">
              <h3>{animal.name} - {animal.id} </h3>
              <p>Type: {animal.type}</p>
              <p> Pasture: {getPastures().find((pasture) => pasture.id === animal.pastureId)?.name}</p>
            </div>
          ))}
        </div>
      </Modal>
      <ToastContainer
        stacked />
    </div>
  );
}

