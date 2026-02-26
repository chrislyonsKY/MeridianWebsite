import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

export function useSources() {
  return useQuery({
    queryKey: [api.sources.list.path],
    queryFn: async () => {
      const res = await fetch(api.sources.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sources");
      
      const data = await res.json();
      const result = api.sources.list.responses[200].safeParse(data);
      
      if (!result.success) {
        console.error("[Zod] sources.list validation failed:", result.error.format());
        throw new Error("Invalid response format from server");
      }
      
      return result.data;
    },
  });
}
