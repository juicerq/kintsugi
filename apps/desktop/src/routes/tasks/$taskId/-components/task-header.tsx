import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Copy,
  GitBranch,
  Clock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Title } from "@/components/ui/title";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "../../../../trpc";
import { WorkflowDialog } from "./workflow-dialog";

interface TaskHeaderProps {
  task: {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
    branch_name: string | null;
    brainstorm: string | null;
    architecture: string | null;
    review: string | null;
    created_at: string;
    completed_at: string | null;
  };
  completedSubtasks?: number;
  totalSubtasks?: number;
}

export function TaskHeader({
  task,
  completedSubtasks = 0,
  totalSubtasks = 0,
}: TaskHeaderProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);

  const utils = trpc.useUtils();
  const toggleComplete = trpc.tasks.toggleComplete.useMutation({
    onSuccess: () => {
      utils.tasks.get.invalidate({ id: task.id });
      utils.tasks.list.invalidate({ projectId: task.project_id });
    },
  });

  const isCompleted = task.completed_at !== null;

  const workflowStages = [
    {
      key: "brainstorm",
      hasContent: !!task.brainstorm,
      color: "bg-purple-500",
      fadedColor: "bg-purple-500/30",
    },
    {
      key: "architecture",
      hasContent: !!task.architecture,
      color: "bg-amber-500",
      fadedColor: "bg-amber-500/30",
    },
    {
      key: "review",
      hasContent: !!task.review,
      color: "bg-green-500",
      fadedColor: "bg-green-500/30",
    },
  ];

  const completedStages = workflowStages.filter((s) => s.hasContent).length;

  async function handleCopyBranch(e: React.MouseEvent) {
    e.stopPropagation();
    if (!task.branch_name) return;
    await navigator.clipboard.writeText(task.branch_name);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    toggleComplete.mutate({ id: task.id });
  }

  const relativeTime = formatDistanceToNow(new Date(task.created_at), {
    addSuffix: true,
  });

  return (
    <>
      <div className="space-y-0">
        {/* Main row - always visible */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 rounded-md px-1 py-1 -mx-1 text-left transition-colors hover:bg-white/[0.02] cursor-pointer"
        >
          {/* Checkbox */}
          <motion.div
            onClick={handleToggleComplete}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors cursor-pointer",
              isCompleted
                ? "border-white/20 bg-white/10"
                : "border-white/20 hover:border-white/40"
            )}
          >
            {isCompleted && <Check className="h-3 w-3 text-white/60" />}
          </motion.div>

          {/* Title */}
          <Title
            size="lg"
            className={cn(
              "flex-1 truncate transition-colors",
              isCompleted && "text-white/50 line-through"
            )}
          >
            {task.title}
          </Title>

          {/* Workflow dots - compact indicator */}
          <div className="flex items-center gap-1">
            {workflowStages.map((stage) => (
              <div
                key={stage.key}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  stage.hasContent ? stage.color : stage.fadedColor
                )}
              />
            ))}
          </div>

          {/* Subtask count if any */}
          {totalSubtasks > 0 && (
            <Text size="xxs" variant="faint">
              {completedSubtasks}/{totalSubtasks}
            </Text>
          )}

          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          </motion.div>
        </button>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pl-8 pt-2 pb-1 space-y-3">
                {/* Description */}
                {task.description && (
                  <Text variant="muted" className="text-[13px] leading-relaxed">
                    {task.description}
                  </Text>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Workflow button */}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setWorkflowOpen(true)}
                    className="text-white/50 hover:text-white/80 hover:bg-white/[0.06] gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Workflow</span>
                    <span className="text-white/40">{completedStages}/3</span>
                  </Button>

                  {/* Branch */}
                  {task.branch_name && (
                    <button
                      type="button"
                      onClick={handleCopyBranch}
                      className={cn(
                        "group flex items-center gap-1.5 rounded px-2 py-1 h-6",
                        "bg-white/[0.04] hover:bg-white/[0.08]",
                        "transition-colors"
                      )}
                    >
                      <GitBranch className="h-3 w-3 text-white/40" />
                      <code className="font-mono text-[11px] text-white/50 group-hover:text-white/70">
                        {task.branch_name}
                      </code>
                      {copied ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  )}

                  {/* Created time */}
                  <div className="flex items-center gap-1 px-1">
                    <Clock className="h-3 w-3 text-white/30" />
                    <Text size="xxs" variant="faint">
                      {relativeTime}
                    </Text>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Workflow Dialog */}
      <WorkflowDialog
        open={workflowOpen}
        onOpenChange={setWorkflowOpen}
        task={task}
      />
    </>
  );
}
