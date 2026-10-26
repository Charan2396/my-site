import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Markdown lives in /content at the repo root so stories can be edited without touching src/.
const stories = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/stories' }),
	schema: z.object({
		title: z.string(),
		stage: z.enum(['source', 'queue', 'process', 'store', 'consume']),
		order: z.number().int(),
		summary: z.string(),
		// Each metric must be quoted from content/resume.md (checked by review).
		metrics: z.array(z.string()).default([]),
		draft: z.boolean().default(false),
	}),
});

const buildLog = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/build-log' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/projects' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		link: z.url().optional(),
		order: z.number().int().default(0),
		draft: z.boolean().default(false),
	}),
});

export const collections = { stories, buildLog, projects };
