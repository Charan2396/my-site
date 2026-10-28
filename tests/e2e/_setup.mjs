// Shared by every suite: base URL, browser launch, screenshot dir.
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const base = process.env.BASE_URL || 'http://localhost:4329/my-site/';
export const OUT = fileURLToPath(new URL('./.out/', import.meta.url));
export const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
// Falls back to Playwright's bundled chromium (`npx playwright install chromium`).
export const launch = () => chromium.launch(existsSync(chrome) ? { executablePath: chrome } : {});
