import './PopUpModal.css'; 
interface PopUpModalProps {
    message: string;
    onClose: () => void;
}

export default function PopUpModal({ message, onClose }: PopUpModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <p className="modal-message">{message}</p>
                <div className="modal-buttons">
                    <button className="btn btn-close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
