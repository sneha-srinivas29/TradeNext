interface FormActionButtonsProps {
  onSaveDraft:       () => void;
  onCancel:          () => void;
  onSave:            () => void;
  showDraftButton?:  boolean;
  isPageLoading?:    boolean;
}

const FormActionButtons = ({
  onSaveDraft,
  onCancel,
  onSave,
  showDraftButton = true,
  isPageLoading   = false,
}: FormActionButtonsProps) => {
  return (
    <div className="flex justify-center gap-4 pt-4 border-t">
      {showDraftButton && (
        <button
          onClick={onSaveDraft}
          disabled={isPageLoading}
          className="bg-gray-100 text-gray-700 border border-gray-300 px-8 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>
      )}
      <button
        onClick={onCancel}
        className="bg-red-600 text-white px-8 py-2 rounded-lg hover:bg-red-800 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={isPageLoading}
        className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
      >
        Save Details
      </button>
    </div>
  );
};

export default FormActionButtons;