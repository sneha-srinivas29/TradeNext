interface UnsavedChangesDialogProps {
  show:         boolean;
  onClose:      () => void;
  onDiscard:    () => void;
  onSaveDraft:  () => void;
}

const UnsavedChangesDialog = ({
  show,
  onClose,
  onDiscard,
  onSaveDraft,
}: UnsavedChangesDialogProps) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl space-y-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-amber-600 text-lg">⚠️</span>
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-foreground">Unsaved Changes</h3>
        <p className="text-sm text-gray-600 dark:text-muted-foreground">
          You have unsaved changes. Would you like to save them as a draft before leaving?
        </p>
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onDiscard}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            Discard
          </button>
          <button
            onClick={onSaveDraft}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 font-medium"
          >
            Save Draft
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesDialog;