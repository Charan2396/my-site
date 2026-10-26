// Post-build leak guard: fails the build if dist/ contains HTML comments, VERIFY notes,
// or any term from the local, gitignored .denylist (one term per line, # for comments).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const TEXT = /\.(html|xml|txt|json|js|css|svg|md)$/i;

const hasDenylist = existsSync('.denylist');
const denylist = hasDenylist
	? readFileSync('.denylist', 'utf8')
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l && !l.startsWith('#'))
	: [];

const files = readdirSync(DIST, { recursive: true, withFileTypes: true })
	.filter((d) => d.isFile() && TEXT.test(d.name))
	.map((d) => join(d.parentPath, d.name));

const problems = [];
for (const file of files) {
	const text = readFileSync(file, 'utf8');
	const lower = text.toLowerCase();
	if (text.includes('<!--')) problems.push(`${file}: contains an HTML comment`);
	if (text.includes('VERIFY')) problems.push(`${file}: contains a VERIFY note`);
	for (const term of denylist) {
		if (lower.includes(term.toLowerCase())) problems.push(`${file}: contains denylisted term "${term}"`);
	}
}

if (problems.length) {
	console.error(`check-dist: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
	process.exit(1);
}
console.log(`check-dist: ${files.length} files clean (${denylist.length} denylist terms${hasDenylist ? '' : ', no .denylist found'})`);
