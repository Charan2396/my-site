// Prefix a site path with the deploy base (`/my-site/` today, `/` once a custom domain lands).
export const url = (path = '') => import.meta.env.BASE_URL.replace(/\/?$/, '/') + path.replace(/^\//, '');
