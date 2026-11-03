// Plain-English glosses for jargon, shown as <abbr title> on first use (see Gloss.astro).
export const glossary: Record<string, string> = {
	'IMS, Db2 and VSAM': 'mainframe databases and files',
	'IMS, Db2, VSAM': 'mainframe databases and files',
	'PIC 9(7)V99': 'a 9-digit number with 2 implied decimal places',
	'CCSID 37': 'character set ID for EBCDIC',
	EBCDIC: 'mainframe text encoding',
	MQMD: 'MQ message header',
	CDC: 'change data capture',
	DogStatsD: 'custom health metrics',
	MERGE: 'update-or-insert',
	idempotent: 'safe to re-run',
	Idempotent: 'safe to re-run',
};
const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(`(?<![\\w])(${Object.keys(glossary).map(esc).join('|')})(?![\\w])`);

/** Split text into strings and {text, title} terms. A term whose gloss is already in `seen` stays plain text. */
export function glossTokens(text: string, seen = new Set<string>()) {
	const out: (string | { text: string; title: string })[] = [];
	let rest = text;
	for (let m = re.exec(rest); m; m = re.exec(rest)) {
		const title = glossary[m[1]];
		out.push(rest.slice(0, m.index));
		if (seen.has(title)) out.push(m[1]);
		else seen.add(title), out.push({ text: m[1], title });
		rest = rest.slice(m.index + m[1].length);
	}
	out.push(rest);
	return out.filter((t) => t !== '');
}
