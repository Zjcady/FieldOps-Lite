"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseFetchOptions {
  /** Don't fetch on mount — wait for manual refetch() */
  manual?: boolean;
  /** Number of retries for transient failures (default: 1) */
  retries?: number;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Shared data fetching hook with error handling.
 * Uses AbortController to cancel stale requests on URL change or unmount.
 */
export function useFetch<T>(url: string | null, options?: UseFetchOptions): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.manual);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    const maxRetries = options?.retries ?? 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          // Don't retry 4xx client errors
          if (res.status >= 400 && res.status < 500) {
            throw new Error(err.error || `Request failed (${res.status})`);
          }
          throw new Error(err.error || `Server error (${res.status})`);
        }
        const json = await res.json();
        if (!controller.signal.aborted) {
          setData(json);
          setError(null);
        }
        lastError = null;
        break;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        lastError = e instanceof Error ? e : new Error("An error occurred");
        // Don't retry 4xx errors
        if (lastError.message.includes("Request failed")) break;
        // Brief delay before retry
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (!controller.signal.aborted) {
      if (lastError) setError(lastError.message);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (!options?.manual) {
      fetchData();
    }
    return () => { abortRef.current?.abort(); };
  }, [fetchData, options?.manual]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch multiple URLs in parallel with shared error handling.
 */
export function useFetchAll<T extends unknown[]>(
  urls: string[]
): { data: { [K in keyof T]: T[K] | null }; loading: boolean; error: string | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
    urls.map(() => null) as { [K in keyof T]: T[K] | null }
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(urls.map((u) => fetch(u, { signal: controller.signal })));
      const results = await Promise.all(
        responses.map(async (r) => {
          if (!r.ok) throw new Error(`Request to ${r.url} failed (${r.status})`);
          return r.json();
        })
      );
      if (!controller.signal.aborted) {
        setData(results as { [K in keyof T]: T[K] | null });
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setError(e instanceof Error ? e.message : "An error occurred");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join(",")]);

  useEffect(() => {
    fetchAll();
    return () => { abortRef.current?.abort(); };
  }, [fetchAll]);

  return { data, loading, error, refetch: fetchAll };
}

/**
 * Safe mutation helper with error handling.
 */
export async function safeMutate<T = unknown>(
  url: string,
  options: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { data: null, error: err.error || `Request failed (${res.status})` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Network error" };
  }
}
