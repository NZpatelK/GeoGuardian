import './PopUpModal.css';
interface PopUpModalProps {
    message: string;
    modalType: 'animal' | 'pasture';
    onClose: () => void;
}

export default function PopUpModal({ message, modalType, onClose }: PopUpModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <p className="modal-message">{message}</p>
                {modalType === 'pasture' &&
                    <div className="modal-buttons">
                        <button className="btn btn-relocate" onClick={onClose}>
                            Relocate Animals
                        </button>
                        <button className="btn btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                }
                {modalType === 'animal' &&
                    <div className="modal-buttons">
                        <button className="btn btn-ok" onClick={onClose}>
                            Yes
                        </button>
                        <button className="btn btn-cancel" onClick={onClose}>
                            No
                        </button>
                    </div>
                }
            </div>
        </div>
    );
}
