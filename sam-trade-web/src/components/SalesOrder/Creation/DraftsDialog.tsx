import { useState, useEffect } from "react";
import { X, FileText, Trash2, Clock } from "lucide-react";
import type { LineItem } from "../../Common/LineItemsTable";

export interface Draft {
  id: string;
  customer: string;
  vendor: string;
  items: LineItem[];
  status: string;
  fromDate: string;
  toDate: string;
  savedAt: string;
}

interface DraftsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
}

const DraftsDialog = ({ isOpen, onClose, onLoadDraft }: DraftsDialogProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    if (isOpen) {
      const savedDrafts = JSON.parse(localStorage.getItem("salesOrderDrafts") || "[]");
      setDrafts(savedDrafts);
    }
  }, [isOpen]);

  const deleteDraft = (id: string) => {
    const updatedDrafts = drafts.filter((d) => d.id !== id);
    localStorage.setItem("salesOrderDrafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Saved Drafts</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-96">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No saved drafts</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your drafts will appear here when you save them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium truncate">{draft.customer || "Untitled Draft"}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{draft.items.length} items</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(draft.savedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onLoadDraft(draft);
                        onClose();
                      }}
                      className="btn-primary text-sm py-1.5"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftsDialog;
