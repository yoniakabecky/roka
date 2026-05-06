<script lang="ts">
	import { loadLocale } from 'wuchale/load-utils';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import {
		NavigationMenuRoot,
		NavigationMenuList,
		NavigationMenuItem,
		NavigationMenuLink
	} from '$lib/components/ui/navigation-menu/index.js';
	import HelpPopover from '$lib/components/HelpPopover.svelte';
	import { navLinks } from '$lib/nav';
	import { version } from '../../../package.json';
	import { locales, type Locale } from '../../locales/data.js';

	let { email = '', locale = 'en' }: { email?: string; locale?: string } = $props();

	const switchLocale = async (newLocale: Locale) => {
		localStorage.setItem('locale', newLocale);
		await loadLocale(newLocale);
		await invalidateAll();
	};
</script>

<header
	class="grid h-14 shrink-0 grid-cols-3 items-center border-b border-border bg-background px-6"
>
	<a href={resolve('/')} class="flex items-baseline gap-4">
		<span class="font-sans text-2xl font-bold text-foreground">Roka</span>
		<span class="text-xs text-muted-foreground">v{version}</span>
	</a>

	<NavigationMenuRoot class="justify-self-center">
		<NavigationMenuList>
			{#each navLinks as link (link.path)}
				<NavigationMenuItem>
					<NavigationMenuLink
						href={resolve(link.path)}
						data-active={page.url.pathname.startsWith(link.path) ? true : undefined}
						class="px-4"
					>
						{link.label}
					</NavigationMenuLink>
				</NavigationMenuItem>
			{/each}
		</NavigationMenuList>
	</NavigationMenuRoot>

	<div class="flex items-center gap-3 justify-self-end">
		{#if email}
			<span class="text-sm text-muted-foreground">{email}</span>
		{/if}
		<HelpPopover />
		<Tabs value={locale} onValueChange={(v) => switchLocale(v as Locale)}>
			<TabsList>
				{#each locales as l (l)}
					<TabsTrigger value={l}>{l.toUpperCase()}</TabsTrigger>
				{/each}
			</TabsList>
		</Tabs>
	</div>
</header>
