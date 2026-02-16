"use client";

import { useState, useEffect, useCallback } from "react";
import { getLogs, deleteLogById, deleteAllLogs } from "@/lib/api";
import { CallbackLog, LogsResponse } from "@/types";
import LogDetailModal from "@/components/LogDetailModal";
import ConfirmModal from "@/components/ConfirmModal";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Home() {
  const [logs, setLogs] = useState<CallbackLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<CallbackLog | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>("");
  const [filterEndpoint, setFilterEndpoint] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "delete" | "deleteAll";
    logId?: string;
  }>({ isOpen: false, type: "delete" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLogs = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      setError(null);
      try {
        const response: LogsResponse = await getLogs(
          page,
          10,
          filterMethod,
          filterEndpoint,
        );
        setLogs(response.data);
        setPagination((prev) => ({ ...prev, ...response.pagination, page }));
      } catch {
        setError("Failed to fetch logs. Make sure the API server is running.");
      } finally {
        setLoading(false);
      }
    },
    [filterMethod, filterEndpoint],
  );

  const handleRefresh = () => {
    fetchLogs(pagination.page);
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMethod, filterEndpoint]);

  const handleDelete = async (id: string) => {
    setConfirmModal({ isOpen: true, type: "delete", logId: id });
  };

  const handleDeleteAll = async () => {
    setConfirmModal({ isOpen: true, type: "deleteAll" });
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (confirmModal.type === "deleteAll") {
        await deleteAllLogs();
        fetchLogs(1);
      } else if (confirmModal.logId) {
        await deleteLogById(confirmModal.logId);
        fetchLogs(pagination.page);
      }
      setConfirmModal({ isOpen: false, type: "delete" });
    } catch {
      setError("Failed to delete log");
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyApiUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${API_BASE_URL}/webhook`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = `${API_BASE_URL}/webhook`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return formatDate(dateStr);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      pagination.page - Math.floor(maxVisiblePages / 2),
    );
    const endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => fetchLogs(1)}
          className="px-3 py-1.5 rounded-md hover:bg-white/10 text-zinc-400"
        >
          1
        </button>,
      );
      if (startPage > 2)
        pages.push(
          <span key="start-ellipsis" className="px-1 text-zinc-600">
            ...
          </span>,
        );
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => fetchLogs(i)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            i === pagination.page
              ? "bg-white text-black"
              : "hover:bg-white/10 text-zinc-400"
          }`}
        >
          {i}
        </button>,
      );
    }

    if (endPage < pagination.pages) {
      if (endPage < pagination.pages - 1)
        pages.push(
          <span key="end-ellipsis" className="px-1 text-zinc-600">
            ...
          </span>,
        );
      pages.push(
        <button
          key="last"
          onClick={() => fetchLogs(pagination.pages)}
          className="px-3 py-1.5 rounded-md hover:bg-white/10 text-zinc-400"
        >
          {pagination.pages}
        </button>,
      );
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-white">Logger</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={copyApiUrl}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-sm font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 text-zinc-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                    <span className="text-zinc-300">Copy URL</span>
                  </>
                )}
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <span className="text-zinc-500 text-sm">Method</span>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-transparent text-white text-sm outline-none cursor-pointer"
            >
              <option value="" className="bg-zinc-900">
                All
              </option>
              <option value="GET" className="bg-zinc-900">
                GET
              </option>
              <option value="POST" className="bg-zinc-900">
                POST
              </option>
              <option value="PUT" className="bg-zinc-900">
                PUT
              </option>
              <option value="PATCH" className="bg-zinc-900">
                PATCH
              </option>
              <option value="DELETE" className="bg-zinc-900">
                DELETE
              </option>
            </select>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3">
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={filterEndpoint}
              onChange={(e) => setFilterEndpoint(e.target.value)}
              placeholder="Search endpoint..."
              className="flex-1 bg-transparent text-white text-sm outline-none py-2 placeholder-zinc-600"
            />
          </div>
          <button
            onClick={() => fetchLogs(1)}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-zinc-500">
            {pagination.total.toLocaleString()}{" "}
            {pagination.total === 1 ? "log" : "logs"}
          </span>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-zinc-300">Refresh</span>
          </button>
        </div>

        {/* Logs List */}
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              <div className="animate-spin w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full mx-auto mb-3"></div>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-500">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-zinc-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              No logs found
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="px-6 py-4 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    {/* Method Badge */}
                    <span
                      className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${METHOD_COLORS[log.method] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {log.method.padEnd(6, " ")}
                    </span>

                    {/* Endpoint */}
                    <code className="text-sm text-white font-mono flex-1 truncate">
                      {log.endpoint}
                    </code>

                    {/* Time & IP */}
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="font-mono">{log.ip || "-"}</span>
                      <span className="whitespace-nowrap">
                        {formatRelativeTime(log.hitAt)}
                      </span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(log._id);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-zinc-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 transition-colors"
              >
                Prev
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1.5 rounded-md text-sm font-medium hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={
          confirmModal.type === "deleteAll" ? "Delete All Logs" : "Delete Log"
        }
        message={
          confirmModal.type === "deleteAll"
            ? "Are you sure you want to delete all logs? This action cannot be undone and will permanently remove all callback history."
            : "Are you sure you want to delete this log? This action cannot be undone."
        }
        confirmText={
          confirmModal.type === "deleteAll" ? "Delete All" : "Delete"
        }
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, type: "delete" })}
        loading={deleteLoading}
      />
    </div>
  );
}
