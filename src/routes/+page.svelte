<script lang="ts">
	import { resolve } from '$app/paths';
	import { buttonVariants } from '$lib/components/ui/button';
</script>

<h1>Welcome to Roka 🎉</h1>

<a href={resolve('/csv-studio')} class={buttonVariants({ variant: 'default', size: 'lg' })}>
	CSV Studio
</a>
