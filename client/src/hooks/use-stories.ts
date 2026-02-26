import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type StoryResponse, type StoriesListResponse } from "@shared/routes";

interface UseStoriesParams {
  topic?: string;
  region?: string;
  page?: number;
  limit?: number;
}

export function useStories(params: UseStoriesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.topic) queryParams.set('topic', params.topic);
  if (params.region) queryParams.set('region', params.region);
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  
  const queryString = queryParams.toString();
  const url = `${api.stories.list.path}${queryString ? `?${queryString}` : ''}`;

  return useQuery({
    queryKey: [api.stories.list.path, params],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stories");
      const data = await res.json();
      // Using safeParse for safety, throwing detailed error if validation fails
      const result = api.stories.list.responses[200].safeParse(data);
      if (!result.success) {
        console.error("[Zod] stories.list validation failed:", result.error.format());
        throw new Error("Invalid response format from server");
      }
      return result.data as StoriesListResponse;
    },
  });
}

export function useStory(id: number) {
  return useQuery({
    queryKey: [api.stories.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.stories.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch story details");
      
      const data = await res.json();
      const result = api.stories.get.responses[200].safeParse(data);
      if (!result.success) {
        console.error("[Zod] stories.get validation failed:", result.error.format());
        throw new Error("Invalid response format from server");
      }
      return result.data as StoryResponse;
    },
    enabled: !!id && !isNaN(id),
  });
}

export function useTriggerPipeline() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.pipeline.trigger.path, {
        method: api.pipeline.trigger.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to trigger pipeline");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate stories list to fetch new data after pipeline runs
      queryClient.invalidateQueries({ queryKey: [api.stories.list.path] });
    },
  });
}
