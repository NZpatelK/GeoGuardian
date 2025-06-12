import React from "react";
import "./ConfirmModal.css"; // Assuming you have a CSS file for styling

interface ConfirmModalProps {
    message: string;
    onConfirm: (result: boolean) => void;
}

export default function ConfirmModal({ message, onConfirm }: ConfirmModalProps) {
    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <p className="modal-message">{message}</p>
                <div className="modal-buttons">
                    <button className="btn btn-yes" onClick={() => onConfirm(true)}>
                        Yes
                    </button>
                    <button className="btn btn-no" onClick={() => onConfirm(false)}>
                        No
                    </button>
                </div>
            </div>
        </div>
    );

}