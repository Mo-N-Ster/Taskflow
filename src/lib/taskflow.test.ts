import { describe, expect, it } from "vitest";
import {
  getProjectProgress,
  getTaskPriorityCounts,
  getTaskStatusCounts,
  getTaskSummary,
  type TaskStatus,
} from "./taskflow";

describe("TaskFlow progress calculation", () => {
  it("calculates the completion percentage from statuses", () => {
    const tasks: Array<{ status: TaskStatus }> = [
      { status: "todo" },
      { status: "in_progress" },
      { status: "done" },
      { status: "done" },
    ];

    expect(getProjectProgress(tasks)).toBe(50);
  });

  it("returns zero when no tasks are available", () => {
    expect(getProjectProgress([])).toBe(0);
  });

  it("groups tasks by status for the project board", () => {
    const tasks: Array<{ status: TaskStatus }> = [
      { status: "todo" },
      { status: "todo" },
      { status: "in_progress" },
      { status: "review" },
      { status: "done" },
    ];

    expect(getTaskStatusCounts(tasks)).toEqual({
      todo: 2,
      in_progress: 1,
      review: 1,
      done: 1,
    });
  });

  it("summarizes the health of a project for the dashboard", () => {
    const tasks: Array<{ status: TaskStatus }> = [
      { status: "todo" },
      { status: "in_progress" },
      { status: "review" },
      { status: "done" },
      { status: "done" },
    ];

    expect(getTaskSummary(tasks)).toEqual({
      total: 5,
      completed: 2,
      inProgress: 1,
      review: 1,
      queued: 1,
      progress: 40,
    });
  });

  it("groups tasks by priority to support project triage", () => {
    const tasks: Array<{ priority: "Low" | "Medium" | "High" }> = [
      { priority: "High" },
      { priority: "High" },
      { priority: "Medium" },
      { priority: "Low" },
      { priority: "Medium" },
    ];

    expect(getTaskPriorityCounts(tasks)).toEqual({
      Low: 1,
      Medium: 2,
      High: 2,
    });
  });
});
