// @ts-check
import { adapter as svelte } from '@wuchale/svelte';
import { adapter as js } from 'wuchale/adapter-vanilla';
import { defineConfig } from 'wuchale';
import { getFuncNameNested } from 'wuchale/adapter-utils';

export default defineConfig({
	locales: ['en', 'ja'],
	adapters: {
		main: svelte({
			loader: 'sveltekit',
			// The default only treats `.svelte.js` as a module, so texts inside functions in
			// `.svelte.ts` files (e.g. toasts in ship.svelte.ts) used `_w_runtime_` without
			// declaring it. Treat `.svelte.ts` the same way.
			runtime: {
				initReactive: (path, file, { module }) => {
					const inTopLevel = getFuncNameNested(path)[0] == null;
					return /\.svelte\.[jt]s$/.test(file) || module ? inTopLevel : inTopLevel ? true : null;
				},
				useReactive: (path, file, { module }) => {
					const inTopLevel = getFuncNameNested(path)[0] == null;
					return /\.svelte\.[jt]s$/.test(file) || module ? inTopLevel : true;
				}
			}
		}),
		js: js({
			loader: 'vite',
			files: ['src/**/+{page,layout}.{js,ts}', 'src/**/+{page,layout}.server.{js,ts}']
		})
	}
});
