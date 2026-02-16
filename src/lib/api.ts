import { LogsResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function getLogs(page: number = 1, limit: number = 10, method?: string, endpoint?: string): Promise<LogsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (method) params.append("method", method);
  if (endpoint) params.append("endpoint", endpoint);

  const res = await fetch(`${API_BASE_URL}/logs?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function getLogById(id: string): Promise<{ success: boolean; data: import("@/types").CallbackLog }> {
  const res = await fetch(`${API_BASE_URL}/logs/${id}`);
  if (!res.ok) throw new Error("Failed to fetch log");
  return res.json();
}

export async function deleteAllLogs(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/logs/all`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete logs");
  return res.json();
}

export async function deleteLogById(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/logs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete log");
  return res.json();
}
