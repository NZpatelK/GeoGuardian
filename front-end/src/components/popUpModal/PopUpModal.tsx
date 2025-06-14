import './PopUpModal.css';
import PasturesApi from '../../services/PasturesApi';
import { useEffect, useState } from 'react';

interface PopUpModalProps {
    message: string;
    modalType: 'deleteConfirmation' | 'animal' | 'pasture' | 'relocateConfirmation';
    currentPastureId?: string;
    onConfirm: (value: boolean) => void;
}

export default function PopUpModal({ message, modalType, currentPastureId, onConfirm }: PopUpModalProps) {
    const [listPastures, setListPastures] = useState<any[]>([]);

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
                        <button className="btn btn-relocate" onClick={() => onConfirm(true)}>
                            {modalType === 'pasture' ? 'Relocate Animals and Delete Pasture' : 'Delete Pasture'}
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
                    <select id="relocate" className="custom-select">
                        <option value="" disabled selected>
                            Select a pasture to relocate animals
                        </option>
                        {listPastures && listPastures.map((pasture: any) => (
                            (currentPastureId !== pasture.id) && <option key={pasture.id} value={pasture.id}>
                                {pasture.name}
                            </option>
                        ))}
                    </select>
                    <div className="modal-buttons">
                        <button className="btn btn-relocate" onClick={() => onConfirm(true)}>
                            Confirm Relocation
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
