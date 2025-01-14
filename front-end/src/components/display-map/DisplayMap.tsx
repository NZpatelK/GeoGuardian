import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon, getFields, isPointInPolygon } from './BoundariesUtils';
import FieldApi from '../../services/FieldApi';
import { Modal } from '../modal/Modal';
export const DisplayMap = () => {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState<HMap | null>(null);
  const [marker, setMarker] = useState<H.map.Marker | null>(null);
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
        const marker = new H.map.Marker({ lat: 37.77053080105853, lng: -122.43959978114759 }); // Adjust coordinates
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

              const { removeTempPolyline, removeTempMarker, polygon } = closePolygon(startPoint as { lat: number; lng: number }, inputName as string);

              hereMap.removeObject(removeTempPolyline as H.map.Polyline);
              hereMap.removeObject(removeTempMarker as H.map.Marker);
              hereMap.addObject(polygon);

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

        hereMap.addEventListener('mapviewchangeend', onZoomChange);

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

  // const moveMarker = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  //   if (!map || !marker) return;

  //   const steps = 1;
  //   const duration = 2000;
  //   const interval = duration / steps;

  //   let step = 0;

  //   const moveAnimate = () => {
  //     step++;

  //     if (step > steps) {
  //       return;
  //     }

  //     const lat = from.lat + (to.lat - from.lat) * step / steps;
  //     const lng = from.lng + (to.lng - from.lng) * step / steps;

  //     marker.setGeometry({ lat, lng });

  //     map.getViewModel().setLookAtData({
  //       position: { lat, lng },
  //     });
  //     setTimeout(moveAnimate, interval);
  //   };

  //   moveAnimate();
  // }

  const updateUserLocation = () => {
    if (mapInstance && marker) {
      const userMarker = marker;
      // Simulate random movement
      const geometry = marker.getGeometry() as H.geo.Point;

      const newLat = geometry.lat + (Math.random() - 0.5) * 0.001;
      const newLng = geometry.lng + (Math.random() - 0.5) * 0.001;

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

  const moveMarker = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    if (!mapInstance || !marker) return;

    const lat = to.lat;
    const lng = to.lng;

    marker.setGeometry({ lat, lng });

    mapInstance.getViewModel().setLookAtData({
      position: { lat, lng },
    });
  };

  const onZoomChange = () => {
    if (mapInstance) {
      console.log('Current Zoom Level:', mapInstance.getZoom());
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
        <button onClick={() => moveMarker({ lat: 37.7749, lng: -122.4194 }, { lat: 37.7749, lng: -122.5194 })}>
          Move Marker
        </button>
        <button onClick={updateUserLocation}>
          Update User Location
        </button>
      </Modal>
    </div>
  );
}

