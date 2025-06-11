import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons"; // Font Awesome icon
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPasture, getPastures, updatePolygonState, createMarker, updatePasture, addNewPoint, updatePastureDatabase, deletePasture, cleanupTemporaryObjects, checkIfCurrentPolygon } from './BoundariesUtils';
import PasturesApi from '../../services/PasturesApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';
import AnimalUtils from './AnimalUtils';
import { labelIcon } from '../../assets/Icon';
import { Navbar } from '../navbar/Navbar';
import { EditModeBar } from '../editModeBar/EditModeBar';

import goBack from '../../assets/back-arrow.png';

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
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [polygonState, setPolygonState] = useState<Record<string, Record<number, boolean>>>({});
  const [displayAnimal, setDisplayAnimal] = useState<Animal[]>([]);
  const [modalIsSelected, setModalIsSelected] = useState("pastures");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const isMapLoaded = useRef(false);

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
              if (!tapDisabled) {
                initialisePastureEditor(hereMap, existingPasture, item.id, behavior);
              }

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
    const updateAnimalLocation = async () => {
      if (!animalRef.current) return;

      const updateAnimalPosition = await AnimalUtils.controlAnimalMovement();

      if (!updateAnimalPosition) return;

      // Update the corresponding animal's position
      const position = animalRef.current[updateAnimalPosition.id];
      if (position) {
        position.setGeometry(new H.geo.Point(updateAnimalPosition.coordinates.lat, updateAnimalPosition.coordinates.lng));
      }

      // Check if the animal is inside the pasture
      bringAnimalBackToPasture(updateAnimalPosition as Animal);


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
      const inputName = prompt("Please enter the name of the pasture:");
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
            initialisePastureEditor(hereMap, { pasture: polygon, labelMarker: label }, result.pastureId, behavior);
          } else {
            console.error("Pasture ID is undefined");
          }
        });
      }

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


  const initialisePastureEditor = async (hereMap: HMap, existingPasture: { pasture: H.map.Polygon, labelMarker: H.map.Marker }, pastureId: string, behavior: H.mapevents.Behavior) => {
    if (modeRefs.current.isDelete) {
      if (!AnimalUtils.hasAnimalsInPasture(pastureId)) {
        hereMap.removeObject(existingPasture.pasture);
        hereMap.removeObject(existingPasture.labelMarker);
        deletePasture(pastureId);
      }
      else{
        alert("Cannot delete pasture with animals in it");
      }
      
      return;
    };

    if (!modeRefs.current.isEdit || selectedPastureRef.current.id) return;

    const markers = selectPasture(existingPasture.pasture, hereMap, behavior);
    markers?.forEach(marker => hereMap.addObject(marker));

    selectedPastureRef.current.id = pastureId;
  }


  const selectPasture = (pasture: H.map.Polygon, hereMap: HMap, behavior: H.mapevents.Behavior) => {
    if (!pasture || !hereMap) return;

    const geometry = pasture.getGeometry() as H.geo.Polygon;
    const exterior = geometry.getExterior();
    // const markers: H.map.Marker[] = [];
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

    const updateMarkers = () => {
      markersRef.current.forEach((marker) => hereMap.removeObject(marker));
      markersRef.current.length = 0;

      points.forEach((point, i) => {
        markersRef.current.push(createAndAddMarker(point, i));
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

    return markersRef.current;
  };

  const updateAnimal = async (pastureId: string) => {
    const animals = AnimalUtils.getAnimalsByPastureId(pastureId);
    if (!animals) return;

    console.log(animals[0].id, animals[0].coordinates);

    for (const animal of animals) {
      bringAnimalBackToPasture(animal);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(animals[0].id, animals[0].coordinates);
    setDisplayAnimal(AnimalUtils.getAnimals());
  }

  const relocateAnimal = async (animal: Animal, relocatePastureId: string) => {
    if (animal && relocatePastureId) {
      AnimalUtils.updateAnimalPasture(animal.id, relocatePastureId);
      bringAnimalBackToPasture(animal);
    };

  }

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

      console.log(updateAnimalPosition.id, updatePolygonState.notificationMsg);

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

  const toggleModal = (modal: string) => {
    setModalIsSelected(modal);
  };

  //TODO: rename this function to something more descriptive
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
          {modalIsSelected === "animals" && displayAnimal.map((animal) => (
            <div key={animal.id} className="animal-item">
              <h3>{animal.name} - {animal.id} </h3>
              <p>Type: {animal.type}</p>
              <p> Pasture: {getPastures().find((pasture) => pasture.id === animal.pastureId)?.name}</p>
            </div>
          ))}

          {modalIsSelected === "selectedAnimal" && (
            <div>
              {selectedOption === "relocate" && <button className='go-back-btn' onClick={() => setSelectedOption(null)}>
                <img src={goBack} alt="Go Back" className='go-back-icon' />
                Back</button>}

              <h3>Animal ID: {selectedAnimalRef.current.animal?.id}</h3>
              <h4>Current Pasture: {getPastures().find((pasture) => pasture.id === selectedAnimalRef.current.animal?.pastureId)?.name}</h4>

              {!selectedOption && <div className="animal-btn-group modal-btn-group">
                <button style={{ backgroundColor: "#ff9800" }} onClick={() => setSelectedOption("relocate")}>Relocate</button>
                <button style={{ backgroundColor: "#f44336" }}>Remove</button>
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
            <>
              {getPastures().map((pasture) => (
                <div key={pasture.id} className="pasture-item">
                  <h3>{pasture.name}</h3>
                  <p>Id: {pasture.id}</p>
                </div>))}
              <button className='pasture-btn' onClick={() => { setSelectedOption("pasture-edit") }} disabled={selectedOption === "pasture-edit"}>Edit Pasture</button>
            </>
          )}
        </div>
      </Modal>

      {selectedOption === "pasture-edit" && (
        <EditModeBar modeRefs={modeRefs} handleClickDone={(e) => cleanUpPastureMarkers(e)} />
      )}

      <Navbar toggleModal={toggleModal} />
      <ToastContainer
        stacked />
    </div>
  );
}


