import axios from "axios";
import { nanoid } from 'nanoid';
import { toast } from 'react-toastify';

class PasturesApi {
    static async getPasturesCoordinates() {
        try {
            const response = await axios.get('http://localhost:3000/api/pastures/getPastures');
            return response.data;
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    static async getPastureById(id: string) {
        try {
            const response = await axios.get(`http://localhost:3000/api/pastures/getPastureById/${id}`);
            return response.data;
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    static async addPasture(polygonCoordinates: { lat: number; lng: number }[], label: string, size: number) {
        const data = {
            id: nanoid(),
            name: label,
            glazing:  "Available for Grazing",
            size: size,
            coordinates: polygonCoordinates,
        };
        try {
            // Send data to the backend using axios
            const response = await axios.post('http://localhost:3000/api/pastures/addPasture', data, {
                headers: {
                    'Content-Type': 'application/json', // Ensure the server expects JSON
                },
            });

            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
            return data;
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

    static async updatePasture(pastureId: string, newCoordinates: { lat: number; lng: number }[]) {
        const data = {
            id: pastureId,
            coordinates: newCoordinates,
        };
        try {
            // Send data to the backend using axios
            const response = await axios.put('http://localhost:3000/api/pastures/updatePasture', data, {
                headers: {
                    'Content-Type': 'application/json', // Ensure the server expects JSON
                },
            });

            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
            return data;
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

    static async deletePasture(pastureId: string) {
        try {
            // Send data to the backend using axios
            const response = await axios.delete(`http://localhost:3000/api/pastures/deletePasture/${pastureId}`);

            toast.success(response.data.message, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: false
            })
            return pastureId;
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

export default PasturesApi