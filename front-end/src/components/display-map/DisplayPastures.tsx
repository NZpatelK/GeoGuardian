import AnimalUtils from "./AnimalUtils";

interface Pasture {
    id: string;
    name: string;
    coordinates: {
        lat: number;
        lng: number;
    }[];
}

interface DisplayPasturesProps {
    pastures: Pasture[]
    handleClickRecenter: (id: string | number | undefined, type: string) => void;
    setSelectedOption: (option: string) => void;
    selectedOption: string;
}


export default function DisplayPastures({ pastures, handleClickRecenter, setSelectedOption, selectedOption }: DisplayPasturesProps) {
    return (
        <>
            {pastures.map((pasture) => (
                <div key={pasture.id} className="pasture-item" onClick={() => handleClickRecenter(pasture.id as string, "pasture")}>
                    <h3>{pasture.name}</h3>

                    {AnimalUtils.getAnimals() &&
                        <div>
                            <p>Total Animals: {AnimalUtils.getAnimalsByPastureId(pasture.id).length}</p>

                            <div className="animal-counts">
                                <p>Pig: {AnimalUtils.getAnimalsByPastureId(pasture.id).filter((animal) => animal.type === "Pig").length}</p>
                                <p>Goat: {AnimalUtils.getAnimalsByPastureId(pasture.id).filter((animal) => animal.type === "Goat").length}</p>
                                <p>Sheep: {AnimalUtils.getAnimalsByPastureId(pasture.id).filter((animal) => animal.type === "Sheep").length}</p>
                                <p>Cow: {AnimalUtils.getAnimalsByPastureId(pasture.id).filter((animal) => animal.type === "Cow").length}</p>
                            </div>
                        </div>}

                </div>))}
            <button className='pasture-btn' onClick={() => { setSelectedOption("pasture-edit") }} disabled={selectedOption === "pasture-edit"}>Edit Pasture</button>
        </>
    )
}