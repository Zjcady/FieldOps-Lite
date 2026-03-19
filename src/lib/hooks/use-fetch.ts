"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface UseFetchOptions {
  /** Don't fetch on mount — wait for manual refetch() */
  manual?: boolean;
}

interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Shared data fetching hook with error handling (#15-22, #46).
 * Handles loading, error states, and prevents state updates on unmounted components.
 */
export function useFetch<T>(url: string | null, options?: UseFetchOptions): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options?.manual);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      if (mountedRef.current) {
        setData(json);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "An error occurred");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [url]);

  useEffect(() => {
    mountedRef.current = true;
    if (!options?.manual) {
      fetchData();
    }
    return () => { mountedRef.current = false; };
  }, [fetchData, options?.manual]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Fetch multiple URLs in parallel with shared error handling (#16).
 */
export function useFetchAll<T extends unknown[]>(
  urls: string[]
): { data: { [K in keyof T]: T[K] | null }; loading: boolean; error: string | null; refetch: () => Promise<void> } {
  const [data, setData] = useState<{ [K in keyof T]: T[K] | null }>(
    urls.map(() => null) as { [K in keyof T]: T[K] | null }
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(urls.map((u) => fetch(u)));
      const results = await Promise.all(
        responses.map(async (r) => {
          if (!r.ok) throw new Error(`Request to ${r.url} failed (${r.status})`);
          return r.json();
        })
      );
      if (mountedRef.current) {
        setData(results as { [K in keyof T]: T[K] | null });
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : "An error occurred");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.join(",")]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    return () => { mountedRef.current = false; };
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
