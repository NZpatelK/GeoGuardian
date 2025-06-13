import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    modalType: 'animal' | 'pasture' | 'deleteConfirmation' | 'relocateConfirmation';
    resolve?: (value: boolean) => void;
  } | null>(null);

  const showModal = (message: string, modalType: 'deleteConfirmation' | 'animal' | 'pasture' | 'relocateConfirmation') => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        message, modalType, resolve,
      });
    });
  };

  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      modalType={modalState.modalType}
      onConfirm={(value: boolean) => {
        modalState.resolve?.(value);
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}