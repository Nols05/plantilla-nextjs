import type { TaskDTO } from "./types";

export const tasksQueryKey = ["tasks"] as const;

/**
 * Shared by the client hook (relative URL) and the server prefetch in
 * app/tasks/page.tsx (absolute URL) so both hit the exact same endpoint and
 * queryKey — required for HydrationBoundary to hand off cleanly.
 */
export async function fetchTasks(baseUrl = ""): Promise<TaskDTO[]> {
  const res = await fetch(`${baseUrl}/api/tasks`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch tasks");
  const data: { tasks: TaskDTO[] } = await res.json();
  return data.tasks;
}
