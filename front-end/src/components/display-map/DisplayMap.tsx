import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon, getFields, isPointInPolygon } from './BoundariesUtils';
import FieldApi from '../../services/FieldApi';
import { Modal } from '../modal/Modal';
import './DisplayMap.css';

export const DisplayMap = () => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [marker, setMarker] = useState<H.map.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number }>({ lat: 37.7749, lng: -122.4194 });
  const polygonState: Record<string, boolean> = {};
  const isMapLoaded = useRef(false);

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
        //add marker of current position
        const marker = new H.map.Marker({ lat: currentPosition.lat, lng: currentPosition.lng }); // Adjust coordinates
        hereMap.addObject(marker);

        let isDrawing = false;
        const existFieldCoordinates: any = await FieldApi.getFieldCoordinates();

        if (existFieldCoordinates) {
          for (const item of existFieldCoordinates) {
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
              const inputName = prompt("Please enter the name of the field:");

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
        setMarker(marker);

        return () => {
          hereMap.dispose();
        };
      };
    }
    initializeMap();
  }, []);


  // useEffect(() => {
  // if (mapInstance && marker) {
  // Simulated user location updates
  // const userMarker = marker;
  // mapInstance.addObject(marker);

  // const polygonState: Record<string, boolean> = {};

  // const updateUserLocation = () => {
  //   // Simulate random movement
  //   const geometry = marker.getGeometry() as H.geo.Point;

  //   const newLat = geometry.lat + (Math.random() - 0.5) * 0.001;
  //   const newLng = geometry.lng + (Math.random() - 0.5) * 0.001;

  //   userMarker.setGeometry({ lat: newLat, lng: newLng });
  //   setMarker(userMarker);

  //   const currentPoint = { lat: newLat, lng: newLng };
  //   const polygonData = getFields();

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


  const updateUserLocation = () => {
    if (mapInstance && marker) {
      const userMarker = marker;
      // Simulate random movement
      // const geometry = marker.getGeometry() as H.geo.Point;

      // const newLat = geometry.lat + (Math.random() - 0.5) * 0.001;
      // const newLng = geometry.lng + (Math.random() - 0.5) * 0.001;

      const newLat = currentPosition.lat;
      const newLng = currentPosition.lng;

      userMarker.setGeometry({ lat: newLat, lng: newLng });
      setMarker(userMarker);

      const currentPoint = { lat: newLat, lng: newLng };
      const polygonData = getFields();

      polygonData.forEach((polygon) => {
        const isInside = isPointInPolygon(currentPoint, polygon.polygon);

        if (isInside && !polygonState[polygon.label]) {
          alert(`Entered ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
          polygonState[polygon.label] = true;

        } else if (!isInside && polygonState[polygon.label]) {
          alert(`Exited ${polygon.label} at ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
          polygonState[polygon.label] = false;

        }
      });
    }
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
          <div className="lat-input input-container">
            <h3> Latitude</h3>
            <input type="number" step="0.0001" value={currentPosition.lat} onChange={(e) => setCurrentPosition({ ...currentPosition, lat: parseFloat(e.target.value) })} />
          </div>
          <div className="lng-input input-container">
            <h3> Longitude</h3>
            <input type="number" step="0.0001" value={currentPosition.lng} onChange={(e) => setCurrentPosition({ ...currentPosition, lng: parseFloat(e.target.value) })} />
          </div>
          <button onClick={updateUserLocation}>
            Update User Location
          </button>
        </div>
      </Modal>
    </div>
  );
}

