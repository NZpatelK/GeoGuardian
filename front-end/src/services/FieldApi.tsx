import axios from "axios";

class FieldApi {
    static async getFieldCoordinates() {
        try {
            const response = await axios.get('http://localhost:3000/api/field-data');  // Using axios to fetch data
            console.log('Response:', response.data);
        } catch (err) {
            console.error('Error fetching data:', err);
        }
    }

    static async addField(polygonCoordinates: { lat: number; lng: number }[]) {
        const data = {
            id: 1,
            name: 'Cow Home',
            coordinates: polygonCoordinates,
        };
        try {
            // Send data to the backend using axios
            const response = await axios.post('http://localhost:3000/save-data', data, {
                headers: {
                    'Content-Type': 'application/json', // Ensure the server expects JSON
                },
            });

            console.log(response.data.message); // Success message
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error('Error:', err.response ? err.response.data : err.message);
            } else {
                console.error('Error:', err);
            }
        }
    }
}

export default FieldApi