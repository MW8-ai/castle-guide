import { TaskCard } from './TaskCard';

interface TaskRailProps {
  title?: string;
  count?: number;
}

export function TaskRail({ title = 'Up Next', count = 3 }: TaskRailProps) {
  return (
    <section class="kit-task-rail">
      <header>
        <h3>{title}</h3>
        <span class="kit-badge">{count}</span>
      </header>
      <TaskCard title="Change HVAC filter" dueInDays={12} />
      <TaskCard title="Water heater flush" dueInDays={28} difficulty={2} />
      <TaskCard
        title="Main panel work"
        dueInDays={99}
        difficulty={5}
        whenNotToDiy
        diyCost={0}
        proCost={500}
      />
    </section>
  );
}
