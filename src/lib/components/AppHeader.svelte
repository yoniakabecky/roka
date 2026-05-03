<script lang="ts">
	import { loadLocale } from 'wuchale/load-utils';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs/index.js';
	import { buttonVariants } from '$lib/components/ui/button';
	import { version } from '../../../package.json';
	import { locales, type Locale } from '../../locales/data.js';
	import { navLinks } from '$lib/nav';

	let { email = '', locale = 'en' }: { email?: string; locale?: string } = $props();

	const switchLocale = async (newLocale: Locale) => {
		localStorage.setItem('locale', newLocale);
		await loadLocale(newLocale);
		await invalidateAll();
	};
</script>

<header
	class="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6"
>
	<div class="flex items-center gap-8">
		<a href={resolve('/')} class="flex items-baseline gap-4">
			<span class="font-sans text-2xl font-bold text-foreground">Roka</span>
			<span class="text-xs text-muted-foreground">v{version}</span>
		</a>

		<nav class="flex items-center gap-2">
			{#each navLinks as link (link.path)}
				<a
					href={resolve(link.path)}
					class={buttonVariants({
						variant: page.url.pathname.startsWith(link.path) ? 'secondary' : 'ghost',
						size: 'sm'
					})}
				>
					{link.label}
				</a>
			{/each}
		</nav>
	</div>

	<div class="flex items-center gap-3">
		{#if email}
			<span class="text-sm text-muted-foreground">{email}</span>
		{/if}
		<Tabs value={locale} onValueChange={(v) => switchLocale(v as Locale)}>
			<TabsList>
				{#each locales as l (l)}
					<TabsTrigger value={l}>{l.toUpperCase()}</TabsTrigger>
				{/each}
			</TabsList>
		</Tabs>
	</div>
</header>
