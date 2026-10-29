// @ts-check
import { defineConfig } from 'astro/config';

// Project-repo Pages URL; when a custom domain arrives, change `site`, drop `base`, add public/CNAME.
// Type is the platform's system font stack (src/styles/global.css), so there are no web fonts to load.
export default defineConfig({
	site: 'https://charan2396.github.io',
	base: '/my-site',
});
