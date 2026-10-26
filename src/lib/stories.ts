import { getCollection } from 'astro:content';
import { stages } from './stages';

// Published stories in pipeline order: by stage, then `order` within a stage.
export async function getStories() {
	const stageIndex = (key: string) => stages.findIndex((s) => s.key === key);
	return (await getCollection('stories', ({ data }) => !data.draft)).sort(
		(a, b) => stageIndex(a.data.stage) - stageIndex(b.data.stage) || a.data.order - b.data.order,
	);
}
