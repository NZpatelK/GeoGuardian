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

/**
 * A React functional component that displays a modal with the count of various animal types
 * in a specified pasture. The modal is only visible when the `isOpen` prop is true.
 *
 * Props:
 * - isOpen: A boolean that determines whether the modal should be displayed.
 * - onClose: A callback function that is triggered when the modal backdrop or the close button is clicked.
 * - pastureId: A string representing the ID of the pasture for which the animal counts are to be displayed.
 *
 * The modal displays the count of Pigs, Goats, Sheep, and Cows using icons and labels, 
 * and provides a close button to dismiss the modal.
 */

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
