import type { ConfirmDialogProps } from "./ConfirmDialog";

export function ConfirmDialogLayout({
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[#1C1C1C]">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            data-testid="confirm-dialog-cancel"
            onClick={onCancel}
            className="flex h-[44px] items-center rounded-lg border border-gray-200 px-5 text-sm font-semibold text-[#1C1C1C] transition-colors hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            data-testid="confirm-dialog-confirm"
            onClick={onConfirm}
            className="flex h-[44px] items-center rounded-lg bg-[#5570F1] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4a63e0]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}