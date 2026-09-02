import { ConfirmDialogLayout } from "./ConfirmDialog.layout";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  if (!props.open) return null;
  return <ConfirmDialogLayout {...props} />;
}