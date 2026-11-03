import { getCollection } from 'astro:content';

/** Published design docs in `order`. */
export const getDesigns = async () =>
	(await getCollection('designs', ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order);
