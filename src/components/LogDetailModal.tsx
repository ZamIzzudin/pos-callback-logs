"use client";

import { CallbackLog } from "@/types";

interface LogDetailModalProps {
  log: CallbackLog;
  onClose: () => void;
}

function safeStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "(empty)";
  try {
    const keys = Object.keys(obj as object);
    if (keys.length === 0) return "(empty)";
    return JSON.stringify(obj, null, 2);
  } catch {
    return "(empty)";
  }
}

function hasKeys(obj: unknown): boolean {
  if (obj === null || obj === undefined) return false;
  try {
    return Object.keys(obj as object).length > 0;
  } catch {
    return false;
  }
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  PATCH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function LogDetailModal({ log, onClose }: LogDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs font-mono font-medium rounded border ${METHOD_COLORS[log.method] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
              {log.method}
            </span>
            <code className="text-sm text-white font-mono">{log.endpoint}</code>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">Request ID</div>
              <code className="text-xs text-zinc-300 font-mono">{log._id}</code>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">Timestamp</div>
              <code className="text-xs text-zinc-300 font-mono">{new Date(log.hitAt).toISOString()}</code>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">IP Address</div>
              <code className="text-xs text-zinc-300 font-mono">{log.ip || "-"}</code>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-3">
              <div className="text-xs text-zinc-500 mb-1">Status</div>
              <span className="text-xs text-emerald-400">Received</span>
            </div>
          </div>

          {/* Query Parameters */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-zinc-300">Query Parameters</span>
              {!hasKeys(log.query) && <span className="text-xs text-zinc-600">empty</span>}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-zinc-300 font-mono">
                {hasKeys(log.query) ? JSON.stringify(log.query, null, 2) : "{}"}
              </pre>
            </div>
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-zinc-300">Headers</span>
              <span className="text-xs text-zinc-600">{Object.keys(log.headers || {}).length} keys</span>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto max-h-48">
              <pre className="text-xs text-zinc-300 font-mono">
                {safeStringify(log.headers)}
              </pre>
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-zinc-300">Body</span>
              {!hasKeys(log.body) && <span className="text-xs text-zinc-600">empty</span>}
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto max-h-64">
              <pre className="text-xs text-zinc-300 font-mono">
                {hasKeys(log.body) ? JSON.stringify(log.body, null, 2) : "{}"}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
