// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

// Project-repo Pages URL; when a custom domain arrives, change `site`, drop `base`, add public/CNAME.
export default defineConfig({
	site: 'https://charan2396.github.io',
	base: '/my-site',
	// Downloaded at build time and served from our own origin (self-hosted, no third-party requests).
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Sans',
			cssVariable: '--font-sans',
			weights: [400, 600],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
		{
			provider: fontProviders.fontsource(),
			name: 'IBM Plex Mono',
			cssVariable: '--font-mono',
			weights: [400, 600],
			styles: ['normal'],
			subsets: ['latin'],
			fallbacks: ['ui-monospace', 'monospace'],
		},
	],
});
