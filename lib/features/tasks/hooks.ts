"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchTasks, tasksQueryKey } from "./queries";
import type { TaskDTO } from "./types";

export function useTasksQuery() {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => fetchTasks(),
  });
}

async function createTask(title: string): Promise<TaskDTO> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create task");
  const data: { task: TaskDTO } = await res.json();
  return data.task;
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la tarea");
    },
  });
}
