import { useState } from "react";
import AnimalCountPopUpModal from "../animalCountPopUpModal/AnimalCountPopUpModal";
import AnimalUtils from "./AnimalUtils";
import { Pasture } from "../../types/pasture";

interface DisplayPasturesProps {
    pastures: Pasture[];
    handleClickRecenter: (id: string | number | undefined, type: string) => void;
    setSelectedOption: (option: string) => void;
    selectedOption: string;
}

/**
 * @description A component that displays a list of pastures with their respective information such as the number of animals, health issues, and pasture size.
 * @param {Pasture[]} pastures The list of pastures to be displayed.
 * @param {(id: string | number | undefined, type: string) => void} handleClickRecenter
 * A function that is called when the user clicks on a pasture, which then recenters the map to the pasture.
 * @param {(option: string) => void} setSelectedOption
 * A function that is called when the user clicks on the edit pasture button, which then sets the selected option to "pasture-edit".
 * @param {string} selectedOption
 * The current selected option.
 * @returns {JSX.Element} A JSX element containing the list of pastures and the edit pasture button.
 */
export default function DisplayPastures({
    pastures,
    handleClickRecenter,
    setSelectedOption,
    selectedOption
}: DisplayPasturesProps) {
    const [openModalPastureId, setOpenModalPastureId] = useState<string | null>(null);

    return (
        <>
            {pastures.map((pasture) => {
                const animals = AnimalUtils.getAnimalsByPastureId(pasture.id) || [];
                const totalHealthIssues = animals.filter((animal) => animal.status !== "Healthy").length;

                return (
                    <div key={pasture.id} className="pasture-item">
                        <h3>{pasture.name}</h3>

                        {AnimalUtils.getAnimals() && (
                            <div className="animal-counts">
                                <p>Total Animals: {animals.length}</p>
                                <p
                                    className="animal-type"
                                    onClick={() => setOpenModalPastureId(pasture.id)}
                                >
                                    More Info
                                </p>
                                {openModalPastureId === pasture.id && (
                                    <AnimalCountPopUpModal
                                        isOpen={true}
                                        onClose={() => setOpenModalPastureId(null)}
                                        pastureId={pasture.id}
                                    />
                                )}
                            </div>
                        )}

                        <p>Health Alert: {totalHealthIssues > 0 ? totalHealthIssues + " Health Issues" : "All Healthy"} </p>
                        <p>Glazing Status: {pasture.glazing}</p>
                        <p>Pasture Size: {pasture.size.toFixed(2)} hectares</p>
                        <button
                            className="recentre-pasture"
                            onClick={() => handleClickRecenter(pasture.id, "pasture")}
                        >
                            Recenter Pasture
                        </button>
                    </div>
                );
            })}

            <button
                className="pasture-btn"
                onClick={() => setSelectedOption("pasture-edit")}
                disabled={selectedOption === "pasture-edit"}
            >
                Edit Pasture
            </button>
        </>
    );
}
