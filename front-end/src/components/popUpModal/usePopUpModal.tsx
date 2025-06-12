import { useState } from "react";
import PopUpModal from "./PopUpModal";

export function usePopUpModal() {
  const [modalState, setModalState] = useState<{
    message: string;
    onClose: () => void;
  } | null>(null);

  const showModal = (message: string) => {
    return new Promise<void>((resolve) => {
      setModalState({
        message, onClose: () => resolve(),
      });
    });
  };

  const PopUpModalComponent = modalState ? (
    <PopUpModal
      message={modalState.message}
      onClose={() => {
        modalState.onClose();
        setModalState(null);
      }}
    />
  ) : null;

  return { showModal, PopUpModalComponent };
}