import { useEffect, useRef, useState } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon } from './BoundariesUtils';
import FieldApi from '../../services/FieldApi';
import { Modal } from '../modal/Modal';
export const DisplayMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState<HMap | null>(null);
  const [marker, setMarker] = useState<H.map.Marker | null>(null);
  let isMapLoaded = false;

  useEffect(() => {
    const initializeMap = async () => {

      if (!mapRef.current || isMapLoaded) return;
      isMapLoaded = true;

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


        //add marker of current position
        const marker = new H.map.Marker({ lat: 37.7749, lng: -122.4194 }); // Adjust coordinates
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

        setMap(hereMap);
        setMarker(marker);


        return () => {
          hereMap.dispose();
        };

      };

    }
    initializeMap();
  }, []);

  const moveMarker = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    if (!map || !marker) return;

    const steps = 2000;
    const duration = 2000;
    const interval = duration / steps;

    let step = 0;

    const moveAnimate = () => {
      step++;

      if (step > steps) {
        return;
      }

      const lat = from.lat + (to.lat - from.lat) * step / steps;
      const lng = from.lng + (to.lng - from.lng) * step / steps;

      marker.setGeometry({ lat, lng });

      map.getViewModel().setLookAtData({
        position: { lat, lng },
      });
      setTimeout(moveAnimate, interval);
    };

    moveAnimate();
  }

  const onZoomChange = () => {
    if (map) {
      console.log('Current Zoom Level:', map.getZoom());
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
      </Modal>
    </div>
  );
}

