import React, { useState } from "react";
import { getPastures } from "./BoundariesUtils";
import { Animal } from "../../types/animal";

interface DisplayAnimalsProps {
    animals: Animal[]
    setModalIsSelected: (modal: string) => void
    CreateNewAnimal: () => void;
    selectedAnimalRef: (arg0: Animal) => void;
}

/**
 * Component to display a list of all animals in the system.
 * 
 * The component includes a dropdown to filter the animals by pasture.
 * 
 * @param animals - An array of all animals in the system
 * @param setModalIsSelected - A function that sets the modal to be displayed
 * @param CreateNewAnimal - A function to create a new animal
 * @param selectedAnimalRef - A function that sets the selected animal
 * @returns A JSX component that displays all animals in the system
 */
export default function DisplayAnimals({ animals, setModalIsSelected, CreateNewAnimal, selectedAnimalRef }: DisplayAnimalsProps) {
    const [selectedFilter, setSelectedFilter] = useState("all");

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFilter(e.target.value);
    };
    return (
        <div>
            <div className="filter-container">
                <label htmlFor="filter" className="filter-label">
                    Filter by Pasture:
                </label>
                <select
                    id="filter"
                    value={selectedFilter}
                    onChange={handleFilterChange}
                    className="filter-select"
                >
                    <option value="all">All</option>
                    {getPastures().map((pasture) => (
                        <option key={pasture.id} value={pasture.id}>
                            {pasture.name}
                        </option>
                    ))}
                </select>
            </div>

            {animals.filter((animal) => animal.pastureId === selectedFilter || selectedFilter === "all").map((animal) =>
                <div key={animal.id} className="animal-item" onClick={() => {
                    selectedAnimalRef(animal);
                    setModalIsSelected("selectedAnimal");
                }}>
                    <h3>{animal.id} - {animal.name}</h3>
                    <p>Type: {animal.type}</p>
                    <p>Age: {animal.age}</p>
                    <p>Status: {animal.status}</p>
                    <p>Current Location: {getPastures().find((pasture) => pasture.id === animal.pastureId)?.name}</p>
                </div>
            )}

            <button className='add-animal-btn' onClick={CreateNewAnimal}>Create New Animal</button>
        </div>
    )

}