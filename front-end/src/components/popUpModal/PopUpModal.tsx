import './PopUpModal.css';
import PasturesApi from '../../services/PasturesApi';
import { useEffect, useState } from 'react';

interface PopUpModalProps {
    message: string;
    modalType: 'deleteConfirmation' | 'animal' | 'pasture' | 'relocateConfirmation';
    currentPastureId?: string;
    onConfirm: (value: boolean | string) => void;
}

export default function PopUpModal({ message, modalType, currentPastureId, onConfirm}: PopUpModalProps) {
    const [listPastures, setListPastures] = useState<any[]>([]);
    const [selectedRelocatePastureId, setSelectedRelocatePastureId] = useState<string>('');

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
        </div>
    );
}
