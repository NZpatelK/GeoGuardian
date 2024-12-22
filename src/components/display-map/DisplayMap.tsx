import { useEffect, useRef } from 'react'
import { startPolygon, getSpecifcPolygonCoordinates, calculateDistanceBetweenPoints, closePolygon, addPointToPolygon } from './BoundariesUtils';

export const DisplayMap = () => {
    const mapRef = useRef(null);

    useEffect(() => {
        const HereApiKey = import.meta.env.VITE_HERE_API_KEY; // Load API key from .env

        if (!HereApiKey) {
            console.error("HERE Maps API key is missing!");
            return;
        }
        // Set up HERE Maps platform
        const platform = new H.service.Platform({
            apikey: HereApiKey, 
        });

        const defaultLayers = platform.createDefaultLayers();

        // Initialize the map
        const map = new H.Map(
            mapRef.current,
            defaultLayers.vector.normal.map,
            {
                center: { lat: 37.7749, lng: -122.4194 }, // Example: San Francisco coordinates
                zoom: 12,
                pixelRatio: window.devicePixelRatio || 1,
            }
        );

        // Enable map events
        const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

        // Add UI controls
        const ui = H.ui.UI.createDefault(map, defaultLayers);

        let isDrawing = false;

        map.addEventListener("tap", (evt) => {
          const coords = map.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );
    
          if (!isDrawing) {
    
            const tempMarker = startPolygon(coords);
            isDrawing = true;
    
            map.addObject(tempMarker);
          } else {
    
            const startPoint = getSpecifcPolygonCoordinates(0);
            const distanceToStart = calculateDistanceBetweenPoints(startPoint, coords);
    
            if (distanceToStart < 10) {
              
             const {removeTempPolyline, removeTempMarker, polygon } = closePolygon(startPoint);
    
              map.removeObject(removeTempPolyline);
              map.removeObject(removeTempMarker);
              map.addObject(polygon);
    
              isDrawing = false;
    
            } else {
    
              const {removeTempPolyline, removeTempMarker, addTempPolyline, addTempMarker } = addPointToPolygon(coords);
    
              if (removeTempPolyline) map.removeObject(removeTempPolyline);
              if (removeTempMarker) map.removeObject(removeTempMarker);
              map.addObject(addTempPolyline);
              map.addObject(addTempMarker);
    
            }
          }
        });
        //Clean up on unmount
        return () => {
            map.dispose();
        };
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
