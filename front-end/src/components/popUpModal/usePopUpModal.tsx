import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    modalType: 'pasture' | 'deleteConfirmation' | 'relocateConfirmation' | 'Input' | 'CreateAnimal';
    currentPastureId?: string;
    resolve?: (value: boolean | string | { name: string; type: string; pastureId: string }) => void;
  } | null>(null);

const showModal = (
  message: string,
  modalType: 'deleteConfirmation' | 'pasture' | 'relocateConfirmation' | 'Input' | 'CreateAnimal',
  currentPastureId?: string
): Promise<boolean | string | { name: string; type: string; pastureId: string }> => {
  return new Promise<boolean | string | { name: string; type: string; pastureId: string }>((resolve) => {
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
      onConfirm={(value: boolean | string | { name: string; type: string; pastureId: string }) => {
        modalState.resolve?.(value);
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}