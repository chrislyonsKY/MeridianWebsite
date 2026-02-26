import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import type { StoryResponse } from "@shared/routes";

export function useBookmarks() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [optimisticIds, setOptimisticIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery<{ stories: StoryResponse[] }>({
    queryKey: ["/api/bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks", { credentials: "include" });
      if (!res.ok) return { stories: [] };
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const addBookmark = useMutation({
    mutationFn: async (storyId: number) => {
      const res = await fetch(`/api/bookmarks/${storyId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onMutate: (storyId) => {
      setPendingIds(prev => new Set(prev).add(storyId));
      setOptimisticIds(prev => new Set(prev).add(storyId));
    },
    onSuccess: (_data, storyId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setPendingIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
    },
    onError: (_err, storyId) => {
      setOptimisticIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
      setPendingIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
    },
  });

  const removeBookmark = useMutation({
    mutationFn: async (storyId: number) => {
      const res = await fetch(`/api/bookmarks/${storyId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove bookmark");
      return res.json();
    },
    onMutate: (storyId) => {
      setPendingIds(prev => new Set(prev).add(storyId));
      setOptimisticIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
    },
    onSuccess: (_data, storyId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      setPendingIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
    },
    onError: (_err, storyId) => {
      setOptimisticIds(prev => new Set(prev).add(storyId));
      setPendingIds(prev => { const n = new Set(prev); n.delete(storyId); return n; });
    },
  });

  const isBookmarked = useCallback((storyId: number): boolean => {
    if (optimisticIds.has(storyId)) return true;
    return data?.stories?.some(s => s.id === storyId) ?? false;
  }, [data, optimisticIds]);

  const isStoryPending = useCallback((storyId: number): boolean => {
    return pendingIds.has(storyId);
  }, [pendingIds]);

  const toggleBookmark = useCallback((storyId: number) => {
    if (pendingIds.has(storyId)) return;
    if (isBookmarked(storyId)) {
      removeBookmark.mutate(storyId);
    } else {
      addBookmark.mutate(storyId);
    }
  }, [isBookmarked, pendingIds, addBookmark, removeBookmark]);

  return {
    bookmarks: data?.stories || [],
    isLoading,
    isBookmarked,
    toggleBookmark,
    isStoryPending,
    isPending: addBookmark.isPending || removeBookmark.isPending,
  };
}
