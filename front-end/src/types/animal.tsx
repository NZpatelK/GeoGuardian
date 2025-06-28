/**
 * GeoGuardian Animal Tracking System
 * This module defines the types and interfaces used for tracking individual animals on the farm.
 * It includes definitions for animal identity, species type, current status, pasture location, and geolocation.
 * @module AnimalTypes
 * @version 1.0.0
 * @author Karan Patel
 * @license MIT
 * @description This module provides the necessary types for managing and monitoring animals, 
 * ensuring type safety and consistency throughout the application when handling animal data.
 * @example
 * // Example usage of the Animal interface
 * const exampleAnimal: Animal = {
 *   id: 101,
 *   name: "Daisy",
 *   type: "Cow",
 *   age: 4,
 *   status: "Healthy",
 *   pastureId: "pasture1",
 *   coordinates: {
 *     lat: 34.0522,
 *     lng: -118.2437
 *   }
 * };
 */
export interface Animal {
  id: number;
  name: string;
  type: 'Cow' | 'Sheep' | 'Goat' | 'Pig';
  age: number;
  status: string;
  pastureId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}