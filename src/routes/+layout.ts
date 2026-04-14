import { locales, type Locale } from '../locales/data.js';
import { browser } from '$app/environment';
import { loadLocale } from 'wuchale/load-utils';
// so that the loaders are registered, only here, not required in nested ones (below)
import '../locales/main.loader.svelte.js';
import '../locales/js.loader.js';

/** @type {import('./$types').LayoutLoad} */
export const load = async () => {
	const locale = (() => {
		if (browser) {
			const stored = localStorage.getItem('locale');
			if (stored && locales.includes(stored as Locale)) return stored as Locale;
			const sysLang = navigator.language.split('-')[0] as Locale;
			if (locales.includes(sysLang)) return sysLang;
		}
		return 'en' as Locale;
	})();

	if (browser) await loadLocale(locale);
	return { locale };
};
