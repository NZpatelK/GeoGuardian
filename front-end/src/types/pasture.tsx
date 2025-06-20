// src/types/pasture.ts

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
