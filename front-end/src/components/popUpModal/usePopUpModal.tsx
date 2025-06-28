import { useState } from "react";
import PopUpModal from "./PopUpModal";

/**
 * @description A hook to show a modal for deleting a pasture, deleting an animal, or creating a new animal.
 * @param {string} message The message to be displayed in the modal.
 * @param {'deleteConfirmation' | 'pasture' | 'relocateConfirmation' | 'Input' | 'CreateAnimal'} modalType The type of the modal to be displayed.
 * @param {'Animal' | 'Pasture'} type The type of the pasture to be deleted or the animal to be created.
 * @param {string} currentPastureId The id of the pasture to be deleted or the pasture where the animal is to be created.
 * @returns {Promise<boolean | string | { name: string; type: string; pastureId: string }>} A promise resolving to a boolean if the modal is confirmed or canceled, a string if the modal is asking for input, or an object with the name, type, and pastureId if the modal is asking for input to create a new animal.
 */
export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    type?: "Animal" | "Pasture";
    modalType: 'pasture' | 'deleteConfirmation' | 'relocateConfirmation' | 'Input' | 'CreateAnimal';
    currentPastureId?: string;
    resolve?: (value: boolean | string | { name: string; type: string; pastureId: string }) => void;
  } | null>(null);

  const showModal = (
    message: string,
    modalType: 'deleteConfirmation' | 'pasture' | 'relocateConfirmation' | 'Input' | 'CreateAnimal',
    type?: "Animal" | "Pasture",
    currentPastureId?: string
  ): Promise<boolean | string | { name: string; type: string; pastureId: string }> => {
    return new Promise<boolean | string | { name: string; type: string; pastureId: string }>((resolve) => {
      setModalState({
        message,
        type,
        modalType,
        currentPastureId,
        resolve,
      });
    });
  };


  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      type={modalState.type}
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