/**
 * GeoGuardian Pasture Management System
 * This module defines the types and interfaces used in the pasture management system.
 * It includes definitions for pasture coordinates, grazing status, and pasture details.
 * @module PastureTypes
 * @version 1.0.0
 * @author Karan Patel
 * @license MIT
 * @description This module provides the necessary types for managing pastures, including their coordinates and grazing status.
 * It is used throughout the application to ensure type safety and consistency when handling pasture data.
 * @example
 * // Example usage of the Pasture interface
 * const examplePasture: Pasture = {
 *   id: "pasture1",
 *   name: "Green Pasture",
 *   glazing: "Currently Grazing",
 *   size: 150,
 *   coordinates: [
 *     { lat: 34.0522, lng: -118.2437 },
 *     { lat: 34.0523, lng: -118.2438 },
 *     { lat: 34.0524, lng: -118.2439 }
 *   ]
 * };
 */
export interface Coordinate {
  lat: number;
  lng: number;
}

export type GlazingStatus =
  | "Currently Grazing"
  | "Resting / Recovering"
  | "Scheduled for Grazing"
  | "Out of Use / Idle"
  | "Unavailable (Environmental or Maintenance)";

export interface Pasture {
  id: string;
  name: string;
  glazing: GlazingStatus;
  size: number;
  coordinates: Coordinate[];
}
