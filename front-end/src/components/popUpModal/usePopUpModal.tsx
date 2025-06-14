import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    modalType: 'animal' | 'pasture' | 'deleteConfirmation' | 'relocateConfirmation';
    currentPastureId?: string;
    resolve?: (value: boolean) => void;
  } | null>(null);

  const showModal = (message: string, modalType: 'deleteConfirmation' | 'animal' | 'pasture' | 'relocateConfirmation', currentPastureId?: string) => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        message, modalType, currentPastureId, resolve,
      });
    });
  };

  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      modalType={modalState.modalType}
      currentPastureId={modalState.currentPastureId}
      onConfirm={(value: boolean) => {
        modalState.resolve?.(value);
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}