import { useState } from "react";
import AnimalCountPopUpModal from "../animalCountPopUpModal/animalCountPopUpModal";
import AnimalUtils from "./AnimalUtils";

interface Pasture {
    id: string;
    name: string;
    glazing: "Available for Grazing" | "Currently Grazing" | "Resting / Recovering" | "Scheduled for Grazing" | "Out of Use / Idle" | "Unavailable (Environmental or Maintenance)";
    size: number; // in hectares or relevant unit
    coordinates: {
        lat: number;
        lng: number
    }[];
}
interface DisplayPasturesProps {
    pastures: Pasture[];
    handleClickRecenter: (id: string | number | undefined, type: string) => void;
    setSelectedOption: (option: string) => void;
    selectedOption: string;
}

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
