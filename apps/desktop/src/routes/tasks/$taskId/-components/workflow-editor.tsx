import { useState, useEffect, useCallback } from "react";
import { trpc } from "../../../../trpc";

type WorkflowTab = "brainstorm" | "architecture" | "review";

interface WorkflowEditorProps {
  task: {
    id: string;
    brainstorm: string | null;
    architecture: string | null;
    review: string | null;
  };
  activeTab: WorkflowTab;
}

export function WorkflowEditor({ task, activeTab }: WorkflowEditorProps) {
  const [content, setContent] = useState(task[activeTab] ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const utils = trpc.useUtils();

  const updateTask = trpc.tasks.update.useMutation({
    onMutate: () => setIsSaving(true),
    onSettled: () => setIsSaving(false),
    onSuccess: () => {
      utils.tasks.get.invalidate({ id: task.id });
    },
  });

  useEffect(() => {
    setContent(task[activeTab] ?? "");
  }, [activeTab, task]);

  const debouncedSave = useCallback(
    debounce((value: string) => {
      updateTask.mutate({
        id: task.id,
        [activeTab]: value || null,
      });
    }, 500),
    [task.id, activeTab]
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);
    debouncedSave(value);
  }

  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder={`Write your ${activeTab} notes here...`}
        className="w-full h-64 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/20 resize-none"
      />
      {isSaving && (
        <span className="absolute top-2 right-2 text-xs text-white/40">
          Saving...
        </span>
      )}
    </div>
  );
}

function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}
