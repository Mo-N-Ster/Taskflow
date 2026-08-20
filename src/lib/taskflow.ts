export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export type ProjectTask = {
  id: string;
  title: string;
  status: TaskStatus;
  assignee: string;
  priority: "Low" | "Medium" | "High";
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
