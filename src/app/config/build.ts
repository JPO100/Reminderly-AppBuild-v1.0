// Build variant. "npx vite build" is the Dev build (Dev tools available).
// "npx vite build --mode release" is the Release build (Dev tools removed).
export const IS_RELEASE_BUILD = import.meta.env.MODE === 'release';
