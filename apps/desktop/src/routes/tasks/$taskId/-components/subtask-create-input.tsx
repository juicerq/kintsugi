import { useState } from "react";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";

interface SubtaskCreateInputProps {
  taskId: string;
}

export function SubtaskCreateInput({ taskId }: SubtaskCreateInputProps) {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const createSubtask = trpc.subtasks.create.useMutation({
    onSuccess: () => {
      setName("");
      utils.subtasks.list.invalidate({ taskId });
      utils.tasks.get.invalidate({ id: taskId });
    },
  });

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && name.trim()) {
      createSubtask.mutate({ taskId, name: name.trim() });
    }
    if (e.key === "Escape") {
      setName("");
      e.currentTarget.blur();
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-2",
        "border border-transparent",
        "focus-within:border-white/10 focus-within:bg-white/[0.02]",
        "transition-colors"
      )}
    >
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-white/20">
        {/* Empty circle placeholder */}
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add subtask..."
        disabled={createSubtask.isPending}
        className={cn(
          "flex-1 min-w-0 bg-transparent text-[13px] text-white/70",
          "placeholder:text-white/30 focus:placeholder:text-white/40",
          "outline-none",
          "disabled:opacity-50"
        )}
      />
    </div>
  );
}
