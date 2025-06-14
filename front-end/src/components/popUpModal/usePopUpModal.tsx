import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    modalType: 'animal' | 'pasture' | 'deleteConfirmation' | 'relocateConfirmation';
    currentPastureId?: string;
    resolve?: (value: boolean | string) => void;
  } | null>(null);

const showModal = (
  message: string,
  modalType: 'deleteConfirmation' | 'animal' | 'pasture' | 'relocateConfirmation',
  currentPastureId?: string
): Promise<boolean | string> => {
  return new Promise<boolean | string>((resolve) => {
    setModalState({
      message,
      modalType,
      currentPastureId,
      resolve,
    });
  });
};


  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      modalType={modalState.modalType}
      currentPastureId={modalState.currentPastureId}
      onConfirm={(value: boolean | string) => {
        modalState.resolve?.(value);
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}