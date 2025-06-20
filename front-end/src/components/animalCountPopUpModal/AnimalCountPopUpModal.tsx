import React from 'react';
import './AnimalCountPopUpModal.css';
import AnimalUtils from '../display-map/AnimalUtils';

import cow from '../../assets/cow.png';
import goat from '../../assets/goat.png';
import pig from '../../assets/pig.png';
import sheep from '../../assets/sheep.png';

interface AnimalModalProps {
    isOpen: boolean;
    onClose: () => void;
    pastureId: string;
}

const AnimalCountPopUpModal
    : React.FC<AnimalModalProps> = ({ isOpen, onClose, pastureId }) => {
        if (!isOpen) return null;

        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="animal-modal-content" onClick={(e) => e.stopPropagation()}>
                    <h2>Animal Count:</h2>
                    <div className="modal-animal-counts">
                        {[
                            { label: "Pig", icon: pig },
                            { label: "Goat", icon: goat },
                            { label: "Sheep", icon: sheep },
                            { label: "Cow", icon: cow }
                        ].map(({ label, icon }) => (
                            <div className='list-animal-count' key={label}>
                                <img src={icon} className="animal-icon" alt={label} />
                                <p className="animal-line">
                                    <span className="animal-label">{label}</span>
                                    <span className="colon">:</span>
                                    <span className="animal-value">
                                        {AnimalUtils.getAnimalsByPastureId(pastureId).filter((animal) => animal.type === label).length}
                                    </span>
                                </p>
                            </div>
                        ))}
                    </div>

                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        );
    };

export default AnimalCountPopUpModal
    ;
