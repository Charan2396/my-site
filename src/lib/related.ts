import { getCollection } from 'astro:content';
import { url } from './url';

// Fixed pages a design or decision may point at; collection pages are looked up by path.
const pages: Record<string, string> = {
	'/': 'The pipeline: one record through all five stages',
	'/reconciliation/': 'Interactive explainer: how reconciliation finds drift',
};

/** Resolve `related` site paths ('/stories/x/', '/designs/x/', or a fixed page) to links. Unknown paths fail the build. */
export async function resolveRelated(paths: string[] = []) {
	const titles: Record<string, string> = { ...pages };
	for (const s of await getCollection('stories', ({ data }) => !data.draft)) titles[`/stories/${s.id}/`] = s.data.title;
	for (const d of await getCollection('designs', ({ data }) => !data.draft)) titles[`/designs/${d.id}/`] = d.data.title;
	return paths.map((p) => {
		if (!(p in titles)) throw new Error(`related: no page at ${p}`);
		return { href: url(p), label: titles[p] };
	});
}
