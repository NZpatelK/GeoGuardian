import { getPastures } from "./BoundariesUtils";

interface Animal {
    id: number;
    name: string;
    type: string;
    pastureId: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}

interface DisplayAnimalsProps {
    animals: Animal[]
    setModalIsSelected: (modal: string) => void
    CreateNewAnimal: () => void;
    selectedAnimalRef: (arg0: Animal) => void;
}


export default function DisplayAnimals({ animals, setModalIsSelected, CreateNewAnimal, selectedAnimalRef }: DisplayAnimalsProps) {
    return (
        <div>
            {animals.map((animal) => (
                <div key={animal.id} className="animal-item" onClick={() => {
                    selectedAnimalRef(animal);
                    setModalIsSelected("selectedAnimal");
                }}>
                    <h3>{animal.id} - {animal.name}</h3>
                    <p>Type: {animal.type}</p>
                    <p>Age:</p>
                    <p>Status:</p>
                    <p>Current Location: {getPastures().find((pasture) => pasture.id === animal.pastureId)?.name}</p>
                </div>
            ))}
            <button className='add-animal-btn' onClick={CreateNewAnimal}>Create New Animal</button>
        </div>
    )

}