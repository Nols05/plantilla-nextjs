import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/core/react-query";
import { fetchTasks, tasksQueryKey } from "@/lib/features/tasks/queries";

import { TasksClient } from "./tasks-client";

// Reference implementation of the TanStack Query advanced-SSR pattern:
// https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
export default async function TasksPage() {
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery({
    queryKey: tasksQueryKey,
    queryFn: () => fetchTasks(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-4 text-2xl font-semibold">Tasks</h1>
        <TasksClient />
      </main>
    </HydrationBoundary>
  );
}
