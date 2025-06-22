import axios from "axios";
import { toast } from 'react-toastify';

// import { nanoid } from 'nanoid';

export class AnimalApi {
    static async getAnimalsCoordinates() {
        try {
            const response = await axios.get('http://localhost:3000/api/animals/getAnimals');
            return response.data;
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    static async addAnimal(animal: { name: string; type: string; pastureId?: string }) {
        const data = {
            name: animal.name,
            type: animal.type,
            pastureId: animal.pastureId,
        };
        try {
            // Send data to the backend using axios
            const response = await axios.post('http://localhost:3000/api/animals/addAnimal', data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
            return response.data;
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
                toast.error(err.message, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            } else {
                console.error('Error:', err);
                toast.error(err as string, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            }
        }
    }
    static async updateAnimalCoordinates(animalId: number, newCoordinates: { lat: number; lng: number }) {
        const data = {
            latitude: newCoordinates.lat,
            longitude: newCoordinates.lng,
        };
        try {
            // Send data to the backend using axios
            await axios.put(`http://localhost:3000/api/animals/updateAnimalCoordinates/${animalId}`, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });


        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);

            } else {
                console.error('Error:', err);
            }
        }
    }

    static async updateRelocatedAnimal(animalId: number, pastureId: string) {
        const data = {
            animalId: animalId,
            pastureId: pastureId,
        };
        try {
            // Send data to the backend using axios
            const response = await axios.put(`http://localhost:3000/api/animals/relocateAnimal`, data, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
                toast.error(err.message, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            } else {
                console.error('Error:', err);
                toast.error(err as string, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            }
        }
    }

    static async removeAnimal(animalId: number) {
        try {
            // Send data to the backend using axios
            const response = await axios.delete (`http://localhost:3000/api/animals/deleteAnimal/${animalId}`);
            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
                toast.error(err.message, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            } else {
                console.error('Error:', err);
                toast.error(err as string, {
                    position: 'top-center',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: false
                })
            }
        }
    }
}

export default AnimalApi