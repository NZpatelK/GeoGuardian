import { useEffect, useRef } from 'react'
import { Map as HMap } from '@here/maps-api-for-javascript';
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon, createLabel, addExistingPolygon } from './BoundariesUtils';
import FieldApi from '../../services/FieldApi';

export const DisplayMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const initializeMap = async () => {
      const HereApiKey = import.meta.env.VITE_HERE_API_KEY; // Load API key from .env

      if (!HereApiKey) {
        console.error("HERE Maps API key is missing!");
        return;
      }
      // Set up HERE Maps platform
      const platform = new H.service.Platform({
        apikey: HereApiKey,
      });

      const defaultLayers = platform.createDefaultLayers() as any;

      // Initialize the map
      const map: HMap | null = mapRef.current
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

      if (map) {
        // Enable map events
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

        // Add UI controls
        const ui = H.ui.UI.createDefault(map, defaultLayers);

        let isDrawing = false;

        const existFieldCoordinates: any = await FieldApi.getFieldCoordinates();
        // console.log('Response:',);

        if (existFieldCoordinates) {

          for (const item of existFieldCoordinates) {
            const coord = item.coordinates as { lat: number; lng: number }[];
            const existingPolygon = addExistingPolygon(coord, item.name);
            map.addObject(existingPolygon.existingPolygon);
            map.addObject(existingPolygon.labelMarker);
          }
        }

        map.addEventListener("tap", (evt: any) => {
          const coords = map.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );

          if (!isDrawing) {

            const tempMarker = startPolygon(coords as { lat: number; lng: number });
            isDrawing = true;

            map.addObject(tempMarker as H.map.Marker);
          } else {

            const startPoint = getSpecifcPolygonCoordinates(0);
            const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords as { lat: number; lng: number });

            if (distanceToStart < 10) {

              const { removeTempPolyline, removeTempMarker, polygon } = closePolygon(startPoint);

              map.removeObject(removeTempPolyline as H.map.Polyline);
              map.removeObject(removeTempMarker as H.map.Marker);
              map.addObject(polygon);

              const label = createLabel("Cow Home");
              map.addObject(label);

              isDrawing = false;

            } else {

              const { removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords as { lat: number; lng: number });

              if (removeTempPolyline) map.removeObject(removeTempPolyline);
              if (removeTempMarker) map.removeObject(removeTempMarker);
              map.addObject(addTempPolyline as H.map.Polyline);
              map.addObject(addTempMarker as H.map.Marker);
            }
          }
        });

        const onZoomChange = () => {
          console.log('Current Zoom Level:', map.getZoom());
        };

        map.addEventListener('mapviewchangeend', onZoomChange);

        return () => {
          map.dispose();
        };

      };

    }
    initializeMap();
  }, []);


  return (
    <div
      ref={mapRef}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    ></div>
  );
}

