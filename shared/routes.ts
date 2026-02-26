import { z } from 'zod';
import { insertStorySchema, stories, sources } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// Response schema for a story with its nested articles and sources
const storyResponseSchema = z.custom<typeof stories.$inferSelect & {
  storyArticles?: Array<{
    id: number;
    sourceSnippet: string | null;
    article: typeof sources.$inferSelect & {
      source: typeof sources.$inferSelect;
    };
  }>;
}>();

export const api = {
  stories: {
    list: {
      method: 'GET' as const,
      path: '/api/stories' as const,
      input: z.object({
        topic: z.string().optional(),
        page: z.coerce.number().optional().default(1),
        limit: z.coerce.number().optional().default(10),
      }).optional(),
      responses: {
        200: z.object({
          stories: z.array(storyResponseSchema),
          totalPages: z.number(),
          currentPage: z.number(),
        }),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/stories/:id' as const,
      responses: {
        200: storyResponseSchema,
        404: errorSchemas.notFound,
      },
    }
  },
  sources: {
    list: {
      method: 'GET' as const,
      path: '/api/sources' as const,
      responses: {
        200: z.array(z.custom<typeof sources.$inferSelect>()),
      },
    }
  },
  pipeline: {
    trigger: {
      method: 'POST' as const,
      path: '/api/cron/pipeline' as const,
      responses: {
        200: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type StoryResponse = z.infer<typeof api.stories.get.responses[200]>;
export type StoriesListResponse = z.infer<typeof api.stories.list.responses[200]>;
