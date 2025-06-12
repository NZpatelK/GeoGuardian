import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

export function useConfirm() {
  const [modalState, setModalState] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
      setModalState({ message, resolve });
    });
  };

  const ConfirmModalComponent = modalState ? (
    <ConfirmModal
      message={modalState.message}
      onConfirm={(result) => {
        modalState.resolve(result);
        setModalState(null);
      }}
    />
  ) : null;

  return { confirm, ConfirmModalComponent };
}
