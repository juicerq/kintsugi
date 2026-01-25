import { Check } from "lucide-react";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { SubtaskDetails } from "./subtask-details";
import { AnimatePresence, motion } from "motion/react";

export type SubtaskCategory = "code" | "test" | "docs" | "fix" | "refactor";
export type SubtaskStatus = "waiting" | "in_progress" | "completed";

interface Subtask {
  id: string;
  task_id: string;
  name: string;
  acceptance_criterias: string | null;
  out_of_scope: string | null;
  category: SubtaskCategory | null;
  status: SubtaskStatus;
  started_at: string | null;
  finished_at: string | null;
  should_commit: number;
  key_decisions: string | null;
  files: string | null;
  notes: string | null;
  index: number;
}

interface SubtaskItemProps {
  subtask: Subtask;
  isExpanded: boolean;
  onToggle: () => void;
}

const categoryColors: Record<SubtaskCategory, string> = {
  code: "bg-purple-500/20 text-purple-400",
  test: "bg-blue-500/20 text-blue-400",
  docs: "bg-cyan-500/20 text-cyan-400",
  fix: "bg-red-500/20 text-red-400",
  refactor: "bg-orange-500/20 text-orange-400",
};

const statusColors: Record<SubtaskStatus, string> = {
  waiting: "bg-white/10 text-white/50",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
};

const statusLabels: Record<SubtaskStatus, string> = {
  waiting: "Waiting",
  in_progress: "In Progress",
  completed: "Completed",
};

export function SubtaskItem({ subtask, isExpanded, onToggle }: SubtaskItemProps) {
  const utils = trpc.useUtils();

  const updateSubtask = trpc.subtasks.update.useMutation({
    onSuccess: () => {
      utils.subtasks.list.invalidate({ taskId: subtask.task_id });
    },
  });

  const isCompleted = subtask.status === "completed";

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    updateSubtask.mutate({
      id: subtask.id,
      status: isCompleted ? "waiting" : "completed",
    });
  }

  function handleCommitToggle(e: React.MouseEvent) {
    e.stopPropagation();
    updateSubtask.mutate({
      id: subtask.id,
      should_commit: !subtask.should_commit,
    });
  }

  return (
    <div>
      <div
        onClick={onToggle}
        className="group flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-white/10 hover:bg-white/[0.02] cursor-pointer"
      >
        <button
          type="button"
          onClick={handleCheckboxClick}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
            isCompleted
              ? "border-white/20 bg-white/10"
              : "border-white/20 hover:border-white/40"
          )}
        >
          {isCompleted && <Check className="h-3 w-3 text-white/60" />}
        </button>

        <Text
          className={cn("flex-1 min-w-0 truncate", isCompleted && "line-through")}
          variant={isCompleted ? "muted" : "default"}
        >
          {subtask.name}
        </Text>

        {subtask.category && (
          <span
            className={cn(
              "px-2 py-0.5 rounded text-xs uppercase font-medium",
              categoryColors[subtask.category]
            )}
          >
            {subtask.category}
          </span>
        )}

        <Text size="xs" variant="muted" className="shrink-0">
          ST-{subtask.index}
        </Text>

        <button
          type="button"
          onClick={handleCommitToggle}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded transition-colors",
            subtask.should_commit
              ? "bg-green-500/20 text-green-400"
              : "bg-white/5 text-white/30 hover:text-white/50"
          )}
          title={subtask.should_commit ? "Will commit" : "Won't commit"}
        >
          <Check className="h-3 w-3" />
        </button>

        <span className={cn("px-2 py-0.5 rounded text-xs", statusColors[subtask.status])}>
          {statusLabels[subtask.status]}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <SubtaskDetails subtask={subtask} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
