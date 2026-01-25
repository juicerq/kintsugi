import { Text } from "@/components/ui/text";
import { Title } from "@/components/ui/title";

interface SubtaskDetailsProps {
  subtask: {
    acceptance_criterias: string | null;
    out_of_scope: string | null;
    key_decisions: string | null;
    files: string | null;
    notes: string | null;
  };
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <Title size="sm" className="mb-1">
        {title}
      </Title>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-white/30 mt-0.5">•</span>
            <Text size="sm" variant="muted">
              {item}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SubtaskDetails({ subtask }: SubtaskDetailsProps) {
  const acceptanceCriterias = parseJsonArray(subtask.acceptance_criterias);
  const outOfScope = parseJsonArray(subtask.out_of_scope);
  const keyDecisions = parseJsonArray(subtask.key_decisions);
  const files = parseJsonArray(subtask.files);

  const hasContent =
    acceptanceCriterias.length > 0 ||
    outOfScope.length > 0 ||
    keyDecisions.length > 0 ||
    files.length > 0 ||
    subtask.notes;

  if (!hasContent) {
    return (
      <div className="ml-8 pl-3 py-2 border-l border-white/10">
        <Text size="sm" variant="muted">
          No details available
        </Text>
      </div>
    );
  }

  return (
    <div className="ml-8 pl-3 py-3 border-l border-white/10 space-y-3">
      <Section title="Acceptance Criteria" items={acceptanceCriterias} />
      <Section title="Out of Scope" items={outOfScope} />
      <Section title="Key Decisions" items={keyDecisions} />
      <Section title="Files" items={files} />
      {subtask.notes && (
        <div>
          <Title size="sm" className="mb-1">
            Notes
          </Title>
          <Text size="sm" variant="muted">
            {subtask.notes}
          </Text>
        </div>
      )}
    </div>
  );
}
