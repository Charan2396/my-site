// The five pipeline stages, in flow order. Story frontmatter `stage` must be one of these keys.
// Descriptions stay generic on purpose (see the confidentiality rule in CLAUDE.md).
export const stages = [
	{ key: 'source', label: 'Source', system: 'Mainframe', detail: 'CDC from IMS, Db2, VSAM' },
	{ key: 'queue', label: 'Queue', system: 'IBM MQ', detail: 'store-and-forward messaging' },
	{ key: 'process', label: 'Process', system: 'Java services', detail: 'split, transform, apply' },
	{ key: 'store', label: 'Store', system: 'Oracle', detail: 'three operational instances' },
	{ key: 'consume', label: 'Consume', system: 'Pub/Sub', detail: 'cloud and downstream teams' },
] as const;

export type StageKey = (typeof stages)[number]['key'];
export const stageKeys = stages.map((s) => s.key) as [StageKey, ...StageKey[]];
