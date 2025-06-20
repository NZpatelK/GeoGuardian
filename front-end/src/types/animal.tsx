
export interface Animal {
  id: number;
  name: string;
  type: string;
  age: number;
  status: string;
  pastureId: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}