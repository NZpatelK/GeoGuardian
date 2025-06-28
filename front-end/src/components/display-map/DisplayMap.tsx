import { useEffect, useRef, useState } from 'react'
import { Map as HMap, map } from '@here/maps-api-for-javascript';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Font Awesome icon
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPasture, getPastures, updatePolygonState, createMarker, updatePasture, addNewPoint, updatePastureDatabase, deletePasture, cleanupTemporaryObjects, checkIfCurrentPolygon, calculateCentroid } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';
import AnimalUtils from './AnimalUtils';
import { labelIcon } from '../../assets/Icon';
import { Navbar } from '../navbar/Navbar';
import { EditModeBar } from '../editModeBar/EditModeBar';
import { usePopUpModal } from '../popUpModal/usePopUpModal';

import goBack from '../../assets/back-arrow.png';
import DisplayPastures from './DisplayPastures';
import DisplayAnimals from './DisplayAnimals';

import { Pasture } from '../../types/pasture';
import { Animal } from '../../types/animal';




/**
 * This component renders a HERE map with pastures and animals.
 * It handles animal and pasture creation, deletion, and relocation.
 * It also handles modal windows for animal and pasture details, and for editing pastures.
 * @returns A JSX element representing the map component.
 */
export const DisplayMap = () => {
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [polygonState, setPolygonState] = useState<Record<string, Record<number, boolean>>>({});
  const [displayAnimal, setDisplayAnimal] = useState<Animal[]>([]);
  const [modalIsSelected, setModalIsSelected] = useState("pastures");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { showModal, PopUpModalComponent } = usePopUpModal();

  const isMapLoaded = useRef(false);

  const mapRef = useRef(null);

  const selectedPastureRef = useRef<{ id: string | null; coord: { lat: number; lng: number }[] }>({ id: null, coord: [] });
  const markersRef = useRef<H.map.Marker[]>([]);

  const selectedAnimalRef = useRef<{ animal: Animal | null }>({ animal: null });
  const animalRef = useRef<Record<number, H.map.Marker>>({});

  const modeRefs = useRef({
    isAdd: false,
    isDelete: false,
    isEdit: false,
    isAddPoint: false,
    isDeletePoint: false,
  })

  useEffect(() => {

    /**
     * Initializes the HERE map with predefined settings and event listeners.
     * 
     * - Checks if the map should be initialized based on the current state.
     * - Loads the HERE Maps API key from the environment variables.
     * - Sets up the platform and default map layers.
     * - Creates a new map instance centered at San Francisco with a specific zoom level.
     * - Enables map events and UI controls.
     * - Loads existing pastures from the API and adds them to the map with event handlers.
     * - Adds functionality to create new pastures by tapping on the map.
     * - Sets the map instance for further use in the application.
     * - Cleans up event listeners and map resources when the component is unmounted.
     */
    const initializeMap = async () => {

      if (!mapRef.current || isMapLoaded.current) return;
      isMapLoaded.current = true;

      const HereApiKey = import.meta.env.VITE_HERE_API_KEY; // Ensure you have your HERE Maps API key set in your environment variables

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
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(hereMap));
        const ui = H.ui.UI.createDefault(hereMap, defaultLayers);

        // ---------------------------------------------------------------------------------------------------------------------------//

        let isDrawing = false;
        const existPasturesCoordinates: Pasture[] = await PasturesApi.getPasturesCoordinates();

        if (existPasturesCoordinates) {
          for (const item of existPasturesCoordinates) {
            const existingPasture = addExistingPasture(item);

            let tapDisabled = false; // Flag to track if tap is disabled

            existingPasture.createPasture.addEventListener('tap', () => {
              if (!tapDisabled) {
                initialisePastureEditor(hereMap, existingPasture, item.id, behavior);
              }

              // Disable tap for 1000ms (1 second)
              tapDisabled = true;
              setTimeout(() => tapDisabled = false, 1000);
            });

            hereMap.addObject(existingPasture.createPasture);
            hereMap.addObject(existingPasture.labelMarker);
          }
        }

        // ---------------------------------------------------------------------------------------------------------------------------//

        const addNewPasture = async (evt: any) => {
          if (!modeRefs.current.isAdd) return;
          const coords = hereMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (!coords) return;
          isDrawing = checkIfCurrentPolygon();
          isDrawing = await createNewPasture(coords, hereMap, behavior, isDrawing);
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
      /**
       * Initializes the animal data, fetches all animal data from the database and adds them to the map.
       * 
       * - Initializes the animal data using AnimalUtils.intialiseAnimals()
       * - Fetches all animal data using AnimalUtils.getAnimals()
       * - Creates a marker for each animal and adds it to the map
       * - Sets the event listener for each marker to display the animal details modal when tapped
       * - Adds the animal to the animalPosition object to keep track of the animal positions
       * - Updates the polygon state by adding the animal to the polygon state
       * - Sets the displayAnimal state to the fetched animal data
       */
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

            position.addEventListener('tap', () => {
              selectedAnimalRef.current.animal = animal;
              setModalIsSelected("selectedAnimal");
            })
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
   * Updates the animal's position and checks if the animal is inside the pasture.
   * - Gets the updated animal position using AnimalUtils.controlAnimalMovement()
   * - Updates the corresponding animal's position if the animal exists in the animalPosition object
   * - Checks if the animal is inside the pasture using bringAnimalBackToPasture()
   * - Updates the displayAnimal state with the new animal data
   */
    const updateAnimalLocation = async () => {
      if (!animalRef.current) return;

      const updateAnimalPosition = await AnimalUtils.controlAnimalMovement();
      if (!updateAnimalPosition) return;
      
      const position = animalRef.current[updateAnimalPosition.id];
      if (position) {
        position.setGeometry(new H.geo.Point(updateAnimalPosition.coordinates.lat, updateAnimalPosition.coordinates.lng));
      }

      bringAnimalBackToPasture(updateAnimalPosition as Animal);

      const newDisplayAnimal = AnimalUtils.getAnimals();
      setDisplayAnimal([...newDisplayAnimal]);
    };

    // Set interval for updating user animals
    const interval = setInterval(updateAnimalLocation, 500); // Update every second
    return () => clearInterval(interval);
  }, []);


  /**
   * Handles the logic for creating a new pasture.
   * @param coords The coordinates of the user's click
   * @param hereMap The HERE map instance
   * @param behavior The HERE map behavior instance
   * @param isDrawing Whether or not the user is currently drawing a polygon
   * @returns A boolean indicating whether drawing should continue
   */
  const createNewPasture = async (
    coords: { lat: number; lng: number },
    hereMap: HMap,
    behavior: H.mapevents.Behavior,
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

      const inputName = await showModal("Please enter a name for the pasture:", 'Input');
      const result = await closePolygon(startPoint, inputName as string);

      if (result) {
        const { removeTempPolyline, removeTempMarker, polygon } = result;
        if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
        if (removeTempMarker) hereMap.removeObject(removeTempMarker);
        hereMap.addObject(polygon);

        const label = createLabel(inputName as string);
        hereMap.addObject(label);

        polygon.addEventListener("tap", () => {
          if (result.pastureId) {
            initialisePastureEditor(hereMap, { createPasture: polygon, labelMarker: label }, result.pastureId, behavior);
          } else {
            console.error("Pasture ID is undefined");
          }
        });
      }

      modeRefs.current.isAdd = false;
      cleanUpPastureMarkers(true);
      return false;
    }

    const { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords);

    if (removeTempPolyline) hereMap.removeObject(removeTempPolyline);
    if (removeTempMarker) hereMap.removeObject(removeTempMarker);
    hereMap.addObject(addTempPolyline as H.map.Polyline);
    hereMap.addObject(addTempMarker as H.map.Marker);

    return true;
  };


  /**
   * Initializes the pasture editor.
   * If the user is in delete mode, this will check if there are any animals in the pasture and prompt the user to relocate them before deleting the pasture.
   * If the user is in edit mode, this will add the pasture's vertices to the map as draggable markers for the user to edit the pasture.
   * @param hereMap The HERE map instance
   * @param existingPasture The existing pasture object
   * @param pastureId The ID of the pasture
   * @param behavior The HERE map behavior instance
   */
  const initialisePastureEditor = async (hereMap: HMap, existingPasture: { createPasture: H.map.Polygon, labelMarker: H.map.Marker }, pastureId: string, behavior: H.mapevents.Behavior) => {
    let deleteComfirmed = false;
    
    if (modeRefs.current.isDelete) {
      if (AnimalUtils.hasAnimalsInPasture(pastureId)) {
        const relocateAnimalsConfirmed = await showModal("Sorry, this pasture cannot be deleted because there are animals in it. Would you like to relocate the animals to another pasture?", 'pasture');

        if (relocateAnimalsConfirmed) {
          const relocatePastureId = await showModal("Please select a pasture to relocate animals to:", 'relocateConfirmation', 'Pasture', pastureId);
          if (relocatePastureId && typeof relocatePastureId === 'string' && relocatePastureId !== pastureId) {
            const animals = AnimalUtils.getAnimalsByPastureId(pastureId);
            if (animals && animals.length > 0) {
              for (const animal of animals) {
                relocateAnimal(animal, relocatePastureId);
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            }
            deleteComfirmed = true;
          }
        }
      }
      else {
        const response = await showModal("Are you sure you want to delete this pasture?", 'deleteConfirmation', 'Pasture');
        deleteComfirmed = response as boolean;
      }

      if (!AnimalUtils.hasAnimalsInPasture(pastureId) && deleteComfirmed) {
        hereMap.removeObject(existingPasture.createPasture);
        hereMap.removeObject(existingPasture.labelMarker);
        deletePasture(pastureId);
      }

      return;
    };

    if (!modeRefs.current.isEdit || selectedPastureRef.current.id) return;

    const markers = selectPasture(existingPasture.createPasture, hereMap, behavior);
    markers?.forEach(marker => hereMap.addObject(marker));

    selectedPastureRef.current.id = pastureId;
  }


  /**
   * Selects a pasture on the map, allowing the user to edit the pasture's
   * vertices by dragging them around. This function is called when the user
   * enters edit mode.
   * @param pasture The pasture to select
   * @param hereMap The HERE map instance
   * @param behavior The HERE map behavior instance
   * @returns An array of markers that represent the pasture's vertices
   */
  const selectPasture = (pasture: H.map.Polygon, hereMap: HMap, behavior: H.mapevents.Behavior) => {
    if (!pasture || !hereMap) return;

    const geometry = pasture.getGeometry() as H.geo.Polygon;
    const exterior = geometry.getExterior();

    markersRef.current = [];
    const points: H.geo.Point[] = [];

    selectedPastureRef.current.coord = exterior.getLatLngAltArray()
      .map((_, i, arr) => i % 3 === 0 ? { lat: arr[i], lng: arr[i + 1] } : null)
      .filter(Boolean) as { lat: number; lng: number }[];;

    for (let i = 0; i < exterior.getPointCount(); i++) {
      points.push(exterior.extractPoint(i));
    }

    const deleteMarker = (index: number) => {
      if (points.length <= 3) {
        alert("You need at least three points to keep the shape.");
        return;
      }

      hereMap.removeObject(markersRef.current[index]);
      points.splice(index, 1);
      markersRef.current.splice(index, 1);

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

      marker.addEventListener("dragend", () => {
        behavior?.enable()
        const newGeo = pasture.getGeometry() as H.geo.Polygon;
        const latLngAltArray = newGeo.getExterior().getLatLngAltArray();
        // if (!latLngAltArray) return;
        selectedPastureRef.current.coord = latLngAltArray
          .map((_, i, arr) => i % 3 === 0 ? { lat: arr[i], lng: arr[i + 1] } : null)
          .filter(Boolean) as { lat: number; lng: number }[];

      });

      hereMap.addObject(marker);
      return marker;
    };

  /**
   * Updates the markers that represent the vertices of the selected pasture.
   * This method is called whenever the user drags a marker to a new location,
   * or when the user adds or removes a marker.
   */
    const updateMarkers = () => {
      markersRef.current.forEach((marker) => hereMap.removeObject(marker));
      markersRef.current.length = 0;

      points.forEach((point, i) => {
        markersRef.current.push(createAndAddMarker(point, i));
      });
    };

    updateMarkers();

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

    return markersRef.current;
  };
  

  /**
   * Recenter the map to the given id and type.
   * This function is used to recenter the map to a specific pasture or animal.
   * If the type is 'pasture', the map is centered to the centroid of the pasture.
   * If the type is 'animal', the map is centered to the coordinates of the animal.
   * @param {string | number | undefined} id The id of the pasture or animal to center the map to.
   * @param {string} type The type of the object to center the map to. Can be 'pasture' or 'animal'.
   */
  const handleClickRecenter = (id: string | number | undefined, type: string) => {
    if (id === undefined) return;

    let Hcentroid = new H.geo.Point(0, 0);

    if (type === 'pasture') {
      const pasture = getPastures().find(pasture => pasture.id === id);
      if (!pasture?.coordinates) return;
      const centroid = calculateCentroid(pasture.coordinates);

      if (centroid === null) return;
      Hcentroid = new H.geo.Point(centroid.lat, centroid.lng);
    }
    else {
      const animal = AnimalUtils.getAnimals().find(animal => animal.id === id);
      if (!animal?.coordinates) return;
      Hcentroid = new H.geo.Point(animal.coordinates.lat, animal.coordinates.lng);
    }

    mapInstance?.setZoom(18);
    mapInstance?.setCenter(Hcentroid, true);
  }


  /**
   * Adds a new animal to the map and database.
   * This function is called when the user clicks the "Create Animal" button.
   * It prompts the user to enter the animal's name, and then adds the animal to the database and the map.
   * A new marker is created on the map at the coordinates of the animal,
   * and the animal is added to the displayAnimal state.
   */
  const CreateNewAnimal = async () => {
    const animal = await showModal("Please enter the animal's name:", 'CreateAnimal');
    const newAnimal = await AnimalUtils.addAnimal(animal as Animal);

    if (!newAnimal) return;

    animalRef.current[newAnimal.id] = newAnimal.coordinates;

    if (!mapInstance) return;
    const newlabel = labelIcon(newAnimal.id.toString());
    const position = new H.map.Marker(
      { lat: newAnimal.coordinates.lat, lng: newAnimal.coordinates.lng },
      { icon: newlabel, data: {} });

    mapInstance.addObject(position);
    position.addEventListener('tap', () => {
      selectedAnimalRef.current.animal = newAnimal;
      setModalIsSelected("selectedAnimal");
    });

    animalRef.current[newAnimal.id] = position;

    setDisplayAnimal((prevAnimals) => [...prevAnimals, newAnimal]);
    setModalIsSelected("animals");
  }

/**
 * Updates the position of all animals in a specified pasture and checks if they are inside the pasture.
 * - Retrieves all animals by the given pasture ID using AnimalUtils.getAnimalsByPastureId().
 * - For each animal, attempts to bring it back to its pasture using bringAnimalBackToPasture().
 * - Waits for a short delay between each operation to simulate asynchronous processing.
 * - Updates the displayAnimal state with the latest animal data.
 * 
 * @param id The ID of the pasture whose animals should be updated.
 */

  const updateAnimal = async (id: string) => {
    const animals = AnimalUtils.getAnimalsByPastureId(id);
    if (!animals) return;

    for (const animal of animals) {
      bringAnimalBackToPasture(animal);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setDisplayAnimal(AnimalUtils.getAnimals());
  }

  /**
   * Relocates an animal to a different pasture.
   * This function is used when the user wants to move an animal to a different pasture.
   * It updates the animal's pastureId in the database using AnimalUtils.updateAnimalPasture(),
   * and then calls bringAnimalBackToPasture() to move the animal's marker to the new pasture.
   * @param {Animal} animal The animal to be relocated.
   * @param {string} relocatePastureId The id of the pasture to which the animal is to be relocated.
   */
  const relocateAnimal = async (animal: Animal, relocatePastureId: string) => {
    if (animal && relocatePastureId) {
      AnimalUtils.updateAnimalPasture(animal.id, relocatePastureId);
      bringAnimalBackToPasture(animal);
    };

  }

  /**
   * Attempts to move an animal back to its pasture.
   * This function is called when the user wants to move an animal back to its pasture.
   * It checks if the animal is inside its pasture using AnimalUtils.checkAnimalInPasture().
   * If the animal is not inside its pasture, it attempts to move it back to the pasture using AnimalUtils.moveAnimalBackToTheirPasture(),
   * and then updates the animal's position on the map.
   * The function also updates the polygon state and generates a notification message based on the animal's movement.
   * If the animal is stuck outside the pasture after a certain number of attempts, a toast notification is shown.
   * @param {Animal} updateAnimalPosition The animal to be moved back to its pasture.
   */
  const bringAnimalBackToPasture = async (updateAnimalPosition: Animal) => {
    const position = animalRef.current[updateAnimalPosition.id];
    if (!position) return;
    let isInside = await AnimalUtils.checkAnimalInPasture(updateAnimalPosition.id);

    let attempts = 0;
    const maxAttempts = 100;  // Prevent infinite loop

    while (!isInside && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const updateAnimalCoord = await AnimalUtils.moveAnimalBackToTheirPasture(updateAnimalPosition.id);
      updateAnimalPosition.coordinates = updateAnimalCoord;
      position.setGeometry(new H.geo.Point(updateAnimalCoord.lat, updateAnimalCoord.lng));
      isInside = await AnimalUtils.checkAnimalInPasture(updateAnimalPosition.id);

      const updatePolygonState = await AnimalUtils.updatePolygonStateAndGenerateNotification(updateAnimalPosition, polygonState);
      setPolygonState(updatePolygonState.polygonState);

      if (updatePolygonState.notificationMsg) {
        toast(updatePolygonState.notificationMsg, {
          type: updatePolygonState.notificationMsg.includes("Entered") ? "success" : "error",
        });
      }
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
  }

  /**
   * Removes an animal from the display and from the backend.
   * It first checks if the user wants to delete the animal by showing a confirmation modal.
   * If the user confirms, it removes the animal from the display and from the backend.
   * If the animal is not found, it shows a toast notification with an error message.
   * @param {number} animalId The id of the animal to be removed.
   */
  const removeAnimal = async (animalId: number) => {
    const deleteConfirmation = await showModal(`Are you sure you want to remove the animal with ID ${animalId}?`, 'deleteConfirmation', 'Animal');

    if (deleteConfirmation) {
      const animalPosition = animalRef.current[animalId];

      if (animalPosition) {

        mapInstance?.removeObject(animalPosition);

        delete animalRef.current[animalId];
        const updatedAnimals = displayAnimal.filter(animal => animal.id !== animalId);
        setDisplayAnimal(updatedAnimals);
        AnimalUtils.removeAnimal(animalId);

        toast.success(`Animal with ID ${animalId} has been removed successfully.`, {
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          position: "top-center",
        });

        setModalIsSelected("animals");

      } else {
        toast.error(`Animal with ID ${animalId} not found.`, {
          autoClose: 3000,
          hideProgressBar: true,
          closeOnClick: true,
          position: "top-center",
        });
      }
    }
  }

  const toggleModal = (modal: string) => {
    setModalIsSelected(modal);
  };


/**
 * Cleans up the markers and updates the pasture database.
 * 
 * This function updates the database with the current coordinates of the selected pasture, removes all markers from the map,
 * and clears the markers reference. It also updates the animal data for the selected pasture and resets the selected pasture's
 * reference values. Temporary polyline and marker objects are also removed from the map. If the modal is closed, the selected option is reset.
 * 
 * @param {boolean} isModelClosed - A flag indicating whether the model is closed, which determines if the selected option should be reset.
 */
  const cleanUpPastureMarkers = (isModelClosed: boolean) => {
    if (selectedPastureRef.current.id && selectedPastureRef.current.coord.length > 0) {
      updatePastureDatabase(selectedPastureRef.current.id, selectedPastureRef.current.coord);

      markersRef.current.forEach((marker) => mapInstance?.removeObject(marker));
      markersRef.current = [];

      updateAnimal(selectedPastureRef.current.id);

      selectedPastureRef.current.id = null;
      selectedPastureRef.current.coord = [];
    }

    const { removeTempPolyline, removeTempMarker } = cleanupTemporaryObjects(true);
    if (removeTempPolyline) mapInstance?.removeObject(removeTempPolyline);
    if (removeTempMarker) mapInstance?.removeObject(removeTempMarker);

    if (isModelClosed) {
      setSelectedOption(null);
    }
  }


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

          {modalIsSelected === "animals" &&
            <DisplayAnimals animals={displayAnimal} setModalIsSelected={setModalIsSelected} CreateNewAnimal={CreateNewAnimal} selectedAnimalRef={(e) => selectedAnimalRef.current.animal = e} />
          }

          {modalIsSelected === "selectedAnimal" && (
            <div>
              {selectedOption === "relocate" && <button className='go-back-btn' onClick={() => setSelectedOption(null)}>
                <img src={goBack} alt="Go Back" className='go-back-icon' />
                Back</button>}

              <h3>Animal ID: {selectedAnimalRef.current.animal?.id}</h3>
              <h4>Current Pasture: {getPastures().find((pasture) => pasture.id === selectedAnimalRef.current.animal?.pastureId)?.name}</h4>

              {!selectedOption && <div className="animal-btn-group modal-btn-group">
                <button style={{ backgroundColor: "#2196F3" }} onClick={() => handleClickRecenter(selectedAnimalRef.current.animal?.id, "animal")}>Track Animal</button>
                <button style={{ backgroundColor: "#ff9800" }} onClick={() => setSelectedOption("relocate")}>Relocate</button>
                <button style={{ backgroundColor: "#f44336" }} onClick={() => removeAnimal(selectedAnimalRef.current.animal?.id as number)}>Remove</button>
                <button style={{ backgroundColor: "#555555" }} onClick={() => setModalIsSelected("animals")}>Close</button>
              </div>}

              {selectedOption === "relocate" && (
                <div className="relocate-modal">
                  <h3>Relocate Pasture:</h3>
                  <div className="relocate-button-group modal-btn-group">
                    {getPastures().map((pasture) => (
                      <button
                        key={pasture.id}
                        onClick={() => relocateAnimal(selectedAnimalRef.current.animal as Animal, pasture.id)}
                        disabled={selectedAnimalRef.current.animal?.pastureId === pasture.id}
                      >
                        {pasture.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {modalIsSelected === "pastures" && (
            <DisplayPastures
              pastures={getPastures()}
              handleClickRecenter={handleClickRecenter}
              setSelectedOption={(e) => setSelectedOption(e)}
              selectedOption={selectedOption || ''} />
          )}
        </div>
      </Modal>

      {selectedOption === "pasture-edit" && (
        <EditModeBar modeRefs={modeRefs} handleClickDone={(e) => cleanUpPastureMarkers(e)} />
      )}

      {PopUpModalComponent}
      <Navbar toggleModal={toggleModal} />
      <ToastContainer stacked />
    </div>
  );
}


