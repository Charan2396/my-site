import { defineCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { stageKeys } from './lib/stages';

// Markdown lives in /content at the repo root so stories can be edited without touching src/.
const stories = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/stories' }),
	schema: z.object({
		title: z.string(),
		stage: z.enum(stageKeys),
		order: z.number().int(),
		summary: z.string(),
		// a few words for a second link on a stage card, e.g. "the log runaway"
		short: z.string().optional(),
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
		// e.g. "University at Buffalo coursework, 2018–19"
		label: z.string(),
		link: z.url().optional(),
		order: z.number().int().default(0),
		draft: z.boolean().default(false),
	}),
});

// Design docs (Google design-doc / ADR shape). Every field restates content/resume.md. options, tradeoffs and
// nonGoals stay empty until the owner supplies them; the page renders a section only when it has content.
const designs = defineCollection({
	loader: glob({ pattern: '*.md', base: './content/designs' }),
	schema: z.object({
		title: z.string(),
		stage: z.enum(stageKeys).optional(),
		order: z.number().int(),
		summary: z.string(),
		proof: z.string(),
		problem: z.string(),
		constraints: z.array(z.string()).default([]),
		options: z.array(z.string()).optional(),
		decision: z.string(),
		tradeoffs: z.string().optional(),
		nonGoals: z.array(z.string()).optional(),
		outcome: z.string(),
		heldUp: z.string().optional(),
		// Presentation-level sections, each restating existing facts; rendered only when filled in.
		whoItServes: z.string().optional(),
		why: z.array(z.string()).optional(),
		guardsAgainst: z.array(z.string()).optional(),
		knownLimits: z.array(z.string()).optional(),
		wentWrong: z.array(z.object({ text: z.string(), href: z.string().optional(), link: z.string().optional() })).optional(),
		// The decision record folded into the doc: status from existing facts, and a forward-looking trigger.
		status: z.enum(['PoC', 'In progress', 'In place']).optional(),
		revisit: z.string().optional(),
		// story slugs, design slugs or site paths starting with '/'
		related: z.array(z.string()).optional(),
		draft: z.boolean().default(false),
	}),
});

// Decision log (Nygard-style ADRs), one YAML list.
const decisions = defineCollection({
	loader: file('content/decisions.yaml'),
	schema: z.object({
		title: z.string(),
		context: z.string(),
		decision: z.string(),
		consequence: z.string().optional(),
		status: z.enum(['PoC', 'In progress', 'In place']),
		revisit: z.string(),
		related: z.array(z.string()).optional(),
	}),
});

// Recommendations wait on a LinkedIn export. The file loader logs an error when its file is missing,
// so the collection is registered only once content/testimonials.yaml exists (items: id, quote, role).
const testimonials = defineCollection({
	loader: file('content/testimonials.yaml'),
	schema: z.object({ quote: z.string(), role: z.string() }),
});

export const collections = {
	stories,
	buildLog,
	projects,
	designs,
	decisions,
	...(existsSync('content/testimonials.yaml') ? { testimonials } : {}),
};
