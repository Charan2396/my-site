// Scripted replay of the one-bad-message incident (content/stories/one-bad-message.md), shown as fig. 3.
// No numbers beyond the story's own: the backlog is shown as a shape, labelled "tens of thousands".
// `at` = stage index the record token sits on; `lit` = stage boxes highlighted (defaults to [at]);
// `error` = the Process box shows the rejecting state; `backlog` = state of the reject bar.
// The keys in `keys` are invented, like the order line in stages.ts.
export const incidentSteps: {
	title: string;
	caption: string;
	at: number;
	lit?: number[];
	error?: boolean;
	backlog?: 'grow' | 'full' | 'drain';
	show?: 'corrupt' | 'alert' | 'keys' | 'story';
}[] = [
	{
		title: 'A corrupt record enters at Source',
		caption:
			'A mainframe change becomes a message, as always. This one has uneven line breaks inside it: the same bytes, split where they should not be.',
		at: 0,
		show: 'corrupt',
	},
	{
		title: 'MQ accepts it like any other message',
		caption: 'The queue stores and forwards bytes. It has no reason to look inside, so the bad message goes through.',
		at: 1,
	},
	{
		title: 'The Java splitter starts rejecting',
		caption:
			'The splitter cannot parse the message and starts rejecting: not just the bad one, but tens of thousands of messages.',
		at: 2,
		error: true,
		backlog: 'grow',
	},
	{
		title: 'An alert fires for missing data',
		caption:
			'Rows stop landing in Oracle and the missing-data alert fires. A growing backlog, or a downstream team asking where their data was, would have told the same story.',
		at: 2,
		lit: [2, 3],
		error: true,
		backlog: 'full',
		show: 'alert',
	},
	{
		title: 'Self-healing: send the keys back to the mainframe',
		caption:
			'Instead of treating every reject as its own problem, capture the keys of the affected records and feed them back to the mainframe.',
		at: 0,
		error: true,
		backlog: 'full',
		show: 'keys',
	},
	{
		title: 'Regenerated from the parent table down',
		caption:
			'The mainframe regenerates the messages from the parent table down. Clean copies flow through the queue and the splitter and land in Oracle.',
		at: 3,
		lit: [0, 1, 2, 3],
		backlog: 'drain',
	},
	{
		title: 'Aftermath: more alerts and a runbook',
		caption:
			'More alerts went in, plus a runbook for the different ways this failure shows up, so the next person does not need to have seen it before.',
		at: 3,
		lit: [],
		show: 'story',
	},
];
