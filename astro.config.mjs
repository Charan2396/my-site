// @ts-check
import { defineConfig } from 'astro/config';

// Project-repo Pages URL; when a custom domain arrives, change `site`, drop `base`, add public/CNAME.
// Body type is the system font stack; only the condensed display face is self-hosted (src/styles/global.css).
export default defineConfig({
	site: 'https://charan2396.github.io',
	base: '/my-site',
});
