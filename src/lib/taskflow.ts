export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type ProjectTask = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  priority: "Low" | "Medium" | "High";
};

export type TaskStatusCounts = Record<TaskStatus, number>;

export type TaskSummary = {
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  queued: number;
  progress: number;
};

export function getProjectProgress(
  tasks: Array<{ status: TaskStatus }>,
): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  return Math.round((completedTasks / tasks.length) * 100);
}

export function getTaskStatusCounts(
  tasks: Array<{ status: TaskStatus }>,
): TaskStatusCounts {
  return {
    todo: tasks.filter((task) => task.status === "todo").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    review: tasks.filter((task) => task.status === "review").length,
    done: tasks.filter((task) => task.status === "done").length,
  };
}

export function getTaskSummary(
  tasks: Array<{ status: TaskStatus }>,
): TaskSummary {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const review = tasks.filter((task) => task.status === "review").length;
  const queued = tasks.filter((task) => task.status === "todo").length;

  return {
    total,
    completed,
    inProgress,
    review,
    queued,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
