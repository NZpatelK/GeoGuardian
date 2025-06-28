import { faker } from '@faker-js/faker';


/**
 * Generates a random coordinate within the bounding box of the given pasture.
 *
 * @param pasture - The pasture object containing the coordinates of its vertices.
 * @returns A random coordinate object with keys 'lat' and 'lng'.
 */
export function getRandomCoordinate(pasture) {
  const latitudes = pasture.coordinates.map(coord => coord.lat);
  const longitudes = pasture.coordinates.map(coord => coord.lng);

  // Calculate min/max latitude and longitude
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  // Generate a random coordinate within the bounding box of the pasture
  const randomLat = faker.number.float({ min: minLat, max: maxLat });
  const randomLng = faker.number.float({ min: minLng, max: maxLng });

  return { lat: randomLat, lng: randomLng };
}

export function getWeightedStatus() {
  const rand = Math.random();
  if (rand < 0.8) return 'Healthy';
  else if (rand < 0.87) return 'Sick';         // 7%
  else if (rand < 0.93) return 'Injured';      // 6%
  else return 'Need Check-Up';                 // 7%
}