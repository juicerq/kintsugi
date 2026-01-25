import { useState } from "react";
import { Title } from "@/components/ui/title";
import { SubtaskItem } from "./subtask-item";
import type { SubtaskCategory, SubtaskStatus } from "./subtask-item";

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

interface SubtaskListProps {
  subtasks: Subtask[];
}

export function SubtaskList({ subtasks }: SubtaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleToggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-3">
      <Title>Subtasks</Title>
      {subtasks.length === 0 && (
        <p className="text-sm text-white/40">No subtasks yet</p>
      )}
      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            isExpanded={expandedId === subtask.id}
            onToggle={() => handleToggle(subtask.id)}
          />
        ))}
      </div>
    </div>
  );
}
