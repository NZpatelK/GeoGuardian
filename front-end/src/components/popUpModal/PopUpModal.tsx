import './PopUpModal.css';
import PasturesApi from '../../services/PasturesApi';
import { useEffect, useState } from 'react';
import DisplayAnimalsCount from './DisplayAnimalsCount';

interface PopUpModalProps {
    message?: string;
    modalType: 'deleteConfirmation' | 'pasture' | 'relocateConfirmation' | 'Input' | 'CreateAnimal'| 'animalCount';
    currentPastureId?: string;
    onConfirm: (value: boolean | string | { name: string; type: string; pastureId: string }) => void;
}

export default function PopUpModal({ message, modalType, currentPastureId, onConfirm }: PopUpModalProps) {
    const [listPastures, setListPastures] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedRelocatePastureId, setSelectedRelocatePastureId] = useState<string>('');
    const [newAnimal, setNewAnimal] = useState<{ name: string; type: string; pastureId: string }>({
        name: '',
        type: '',
        pastureId: ''
    });

    useEffect(() => {
        async function fetchPastures() {
            setListPastures(await PasturesApi.getPasturesCoordinates());
        }
        fetchPastures();
    }, []);

    return (
        <div className="modal-overlay">
            ({(modalType === 'pasture' || modalType === 'deleteConfirmation') &&
                <div className="modal-box">
                    <p className="modal-message">{message}</p>
                    <div className="modal-buttons">
                        <button className="btn btn-confirm" onClick={() => onConfirm(true)}>
                            {modalType === 'pasture' ? 'Relocate Animals and Delete Pasture' : 'Delete Animal'}
                        </button>
                        <button className="btn btn-cancel" onClick={() => onConfirm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            }
            {(modalType === 'relocateConfirmation') &&
                <div className="modal-box">
                    <p className="modal-message select-label">{message}</p>
                    {/* <label htmlFor="relocate" className="select-label">Select Pasture: {selectedRelocatePastureId}</label> */}
                    <select id="relocate" className="custom-select" onChange={(e) => setSelectedRelocatePastureId(e.target.value)} value={selectedRelocatePastureId}>
                        <option value="" disabled>
                            Select a pasture to relocate animals
                        </option>
                        {listPastures && listPastures.map((pasture: any) => (
                            (currentPastureId !== pasture.id) && <option key={pasture.id} value={pasture.id}>
                                {pasture.name}
                            </option>
                        ))}
                    </select>
                    <div className="modal-buttons">
                        <button className="btn btn-confirm" onClick={() => onConfirm(selectedRelocatePastureId)}>
                            Confirm Relocation
                        </button>
                        <button className="btn btn-cancel" onClick={() => onConfirm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            }
            {(modalType === 'Input') &&
                <div className="modal-box">
                    <p className="modal-message">{message}</p>
                    <input type="text" className="modal-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                    <div className="modal-buttons">
                        <button className="btn btn-input-confirm" onClick={() => onConfirm(inputValue)} >
                            Confirm
                        </button>
                        {/* <button className="btn btn-cancel" onClick={() => onConfirm(false)}>
                            Cancel
                        </button> */}
                    </div>
                </div>
            }
            {
                (modalType === 'CreateAnimal') &&
                <div className="modal-box">
                    <p className="modal-message">{message}</p>
                    <input type="text" className="modal-input" placeholder="Animal Name" value={newAnimal.name} onChange={(e) => setNewAnimal({ ...newAnimal, name: e.target.value })} />

                    <select id="animalType" className="custom-select" onChange={(e) => setNewAnimal({ ...newAnimal, type: e.target.value })} value={newAnimal.type}>
                        <option value="" disabled>
                            Select Animal Type
                        </option>
                        <option value="Cow">Cow</option>
                        <option value="Sheep">Sheep</option>
                        <option value="Goat">Goat</option>
                    </select>

                    <p className="modal-message">Please select a pasture to create the animal in.</p>
                    <select id="pasture" className="custom-select" onChange={(e) => setNewAnimal({ ...newAnimal, pastureId: e.target.value })} value={newAnimal.pastureId}>
                        <option value="" disabled>
                            Select Pasture
                        </option>
                        {listPastures && listPastures.map((pasture: any) => (
                            <option key={pasture.id} value={pasture.id}>
                                {pasture.name}
                            </option>
                        ))}
                    </select>

                    <div className="modal-buttons">
                        <button className="btn btn-confirm" onClick={() => onConfirm(newAnimal)}>
                            Create Animal
                        </button>
                        <button className="btn btn-cancel" onClick={() => onConfirm(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            }
        </div>
    );
}
