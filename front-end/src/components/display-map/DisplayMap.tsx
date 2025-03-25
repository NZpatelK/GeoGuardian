import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Font Awesome icon
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPasture, getPastures, updatePolygonState, createMarker, updatePasture, addNewPoint } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';
import AnimalUtils from './AnimalUtils';
import { labelIcon } from '../../assets/Icon';
import { Navbar } from '../navbar/Navbar';
import { EditModeBar } from '../editModeBar/EditModeBar';

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
  const [modalIsSelected, setModalIsSelected] = useState("pastures");
  const isMapLoaded = useRef(false);

  const isSelectedPastureRef = useRef(false);
  const modeRefs = useRef({
    isAdd: false,
    isDelete: false,
    isEdit: false,
    isAddPoint: false,
    isDeletePoint: false,
  })

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
        let currentPositionId: any;
        const existPasturesCoordinates: any = await PasturesApi.getPasturesCoordinates();

        if (existPasturesCoordinates) {
          for (const item of existPasturesCoordinates) {
            const coord = item.coordinates as { lat: number; lng: number }[];
            const existingPasture = addExistingPasture(coord, item.name, item.id);

            let tapDisabled = false; // Flag to track if tap is disabled

            existingPasture.pasture.addEventListener('tap', () => {
              if (tapDisabled || !modeRefs.current.isEdit || isSelectedPastureRef.current || item.id === currentPositionId) return;

              currentPositionId = item.id;

              const markers = selectPasture(existingPasture.pasture, hereMap, behavior);
              markers?.forEach(marker => hereMap.addObject(marker));

              isSelectedPastureRef.current = true;

              // Disable tap for 1000ms (1 second)
              tapDisabled = true;
              setTimeout(() => tapDisabled = false, 1000);
            });

            hereMap.addObject(existingPasture.pasture);
            hereMap.addObject(existingPasture.labelMarker);
          }
        }

        const addNewPasture = async (evt: any) => {
          if (!modeRefs.current.isAdd) return;
          const coords = hereMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (!coords) return;
          isDrawing = await createNewPasture(coords, hereMap, isDrawing);
        };

        hereMap.addEventListener("tap", addNewPasture);

        hereMap.addEventListener('mapviewchangeend', () => {
          const zoom = hereMap.getZoom();
          console.log(zoom);
        });

        setMapInstance(hereMap);

        return () => {
          hereMap.removeEventListener('tap', addNewPasture);
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


  const createNewPasture = async (
    coords: { lat: number; lng: number },
    hereMap: HMap,
    isDrawing: boolean
  ): Promise<boolean> => {
    if (!isDrawing) {
      const tempMarker = startPolygon(coords);
      hereMap.addObject(tempMarker as H.map.Marker);
      return true;
    }

    const startPoint = getSpecifcPolygonCoordinates(0);
    const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords);

    if (distanceToStart < 10) {
      const inputName = prompt("Please enter the name of the pasture:");
      const result = await closePolygon(startPoint, inputName as string);

      if (result) {
        const { removeTempPolyline, removeTempMarker, polygon } = result;
        if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
        if (removeTempMarker) hereMap.removeObject(removeTempMarker);
        hereMap.addObject(polygon);
      }

      const label = createLabel(inputName as string);
      hereMap.addObject(label);

      return false;
    }

    const { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords);

    if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
    if (removeTempMarker) hereMap.removeObject(removeTempMarker);
    hereMap.addObject(addTempPolyline as H.map.Polyline);
    hereMap.addObject(addTempMarker as H.map.Marker);

    return true;
  };


  const selectPasture = (pasture: H.map.Polygon, hereMap: HMap, behavior: H.mapevents.Behavior) => {
    if (!pasture || !hereMap) return;

    const geometry = pasture.getGeometry() as H.geo.Polygon;
    const exterior = geometry.getExterior();
    const markers: H.map.Marker[] = [];
    const points: H.geo.Point[] = [];

    for (let i = 0; i < exterior.getPointCount(); i++) {
      points.push(exterior.extractPoint(i));
    }

    const deleteMarker = (index: number) => {
      if (points.length <= 3) {
        alert("You need at least three points to keep the shape.");
        return;
      }

      hereMap.removeObject(markers[index]);
      points.splice(index, 1);
      markers.splice(index, 1);

      updateMarkers();
      pasture = updatePasture(points, pasture);
    };

    const createAndAddMarker = (point: H.geo.Point, index: number) => {
      const marker = createMarker(point);
      marker.draggable = true;

      marker.addEventListener("tap", () => modeRefs.current.isDeletePoint && deleteMarker(index));

      marker.addEventListener("dragstart", () => behavior?.disable());

      marker.addEventListener("drag", (ev) => {
        const draggedPoint = hereMap.screenToGeo(ev.currentPointer.viewportX, ev.currentPointer.viewportY);
        if (!draggedPoint) return;

        points[index] = draggedPoint;
        marker.setGeometry(draggedPoint);
        pasture = updatePasture(points, pasture);
      });

      marker.addEventListener("dragend", () =>
        behavior?.enable());

      hereMap.addObject(marker);
      return marker;
    };

    const updateMarkers = () => {
      markers.forEach((marker) => hereMap.removeObject(marker));
      markers.length = 0;

      points.forEach((point, i) => {
        markers.push(createAndAddMarker(point, i));
      });
    };

    updateMarkers(); // Initialize markers

    pasture.addEventListener("tap", (evt) => {
      if (!modeRefs.current.isAddPoint) return;
      const newPoint = hereMap.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);
      if (!newPoint) return;

      const result = addNewPoint(newPoint as H.geo.Point, points, pasture);

      if (result) {
        points.length = 0;
        points.push(...result.points);
        pasture = result.pasture;
        updateMarkers();
      }
    });

    return markers;
  };

  const toggleModal = (modal: string) => {
    setModalIsSelected(modal);
  };

  // const togglePastureControl = (selectMode: number) => {
  //   Object.assign(modeRefs.current, {
  //     isAdd: selectMode === 1,
  //     isEdit: selectMode === 2 || selectMode === 4 || selectMode === 5,
  //     isDelete: selectMode === 3,
  //     isAddPoint: selectMode === 4,
  //     isDeletePoint: selectMode === 5,
  //   });

  //   toast("Please select a pasture to edit", {
  //     type: "info",
  //     position: "top-center",
  //   });
  // };

  const togglePastureControl = (selectMode: 1 | 2 | 3 | 4 | 5) => {
    const modeMap = {
      1: { isAdd: true, message: "Add Mode: Click on the map to create a new pasture." },
      2: { isEdit: true, message: "Edit Mode: Select a pasture to modify its shape." },
      3: { isDelete: true, message: "Delete Mode: Select a pasture to remove it." },
      4: { isEdit: true, isAddPoint: true, message: "Add Point Mode: Click on a boundary to add a new point." },
      5: { isEdit: true, isDeletePoint: true, message: "Delete Point Mode: Select an existing point to remove it." },
    };
  
    Object.assign(modeRefs.current, {
      isAdd: false, isEdit: false, isDelete: false, isAddPoint: false, isDeletePoint: false,
      ...modeMap[selectMode],
    });
  
    toast(modeMap[selectMode]?.message || "Invalid mode selected", {
      type: "info",
      position: "top-center",
    });
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
          {modalIsSelected === "animals" && displayAnimal.map((animal) => (
            <div key={animal.id} className="animal-item">
              <h3>{animal.name} - {animal.id} </h3>
              <p>Type: {animal.type}</p>
              <p> Pasture: {getPastures().find((pasture) => pasture.id === animal.pastureId)?.name}</p>
            </div>
          ))}

          {modalIsSelected === "pastures" && (
            <>
              {getPastures().map((pasture) => (
                <div key={pasture.id} className="pasture-item">
                  <h3>{pasture.name}</h3>
                  <p>Id: {pasture.id}</p>
                </div>))}
              <div className="button-group">
                <button onClick={() => togglePastureControl(1)} disabled={modeRefs.current.isAdd} style={{ marginLeft: "0" }}>Add</button>
                <button onClick={() => togglePastureControl(2)} disabled={modeRefs.current.isEdit}>Edit</button>
                <button onClick={() => togglePastureControl(3)} disabled={modeRefs.current.isDelete} style={{ marginRight: "0" }}>Delete</button>
              </div>
            </>
          )}
        </div>
      </Modal>
      {(modeRefs.current.isEdit && isSelectedPastureRef.current) && <EditModeBar togglePastureControl={togglePastureControl} />}
      <Navbar toggleModal={toggleModal} />
      <ToastContainer
        stacked />
    </div>
  );
}

