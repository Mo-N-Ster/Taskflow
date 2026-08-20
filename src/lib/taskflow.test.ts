import { describe, expect, it } from "vitest";
import { getProjectProgress, type TaskStatus } from "./taskflow";

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
});
