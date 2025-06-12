import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    modalType: 'animal' | 'pasture';
    onClose: () => void;
  } | null>(null);

  const showModal = (message: string, modalType: 'animal' | 'pasture') => {
    return new Promise<void>((resolve) => {
      setModalState({
        message, modalType, onClose: () => resolve(),
      });
    });
  };

  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      modalType={modalState.modalType}
      onClose={() => {
        modalState.onClose();
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}