<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const tabsListVariants = tv({
		base: 'rounded-lg data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col',
		variants: {
			variant: {
				default: 'cn-tabs-list-variant-default bg-muted',
				line: 'cn-tabs-list-variant-line gap-1 bg-transparent'
			},
			color: {
				default: '',
				primary: 'cn-tabs-list-color-primary',
				secondary: 'cn-tabs-list-color-secondary',
				destructive: 'cn-tabs-list-color-destructive'
			},
			size: {
				default: 'group-data-horizontal/tabs:h-8 p-[3px]',
				sm: 'group-data-horizontal/tabs:h-6 p-[2px]'
			}
		},
		defaultVariants: {
			variant: 'default',
			color: 'default',
			size: 'default'
		}
	});

	export type TabsListVariant = VariantProps<typeof tabsListVariants>['variant'];
	export type TabsListColor = VariantProps<typeof tabsListVariants>['color'];
	export type TabsListSize = VariantProps<typeof tabsListVariants>['size'];
</script>

<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		variant = 'default',
		color = 'default',
		size = 'default',
		class: className,
		...restProps
	}: TabsPrimitive.ListProps & {
		variant?: TabsListVariant;
		color?: TabsListColor;
		size?: TabsListSize;
	} = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	data-variant={variant}
	data-color={color}
	data-size={size}
	class={cn(tabsListVariants({ variant, color, size }), className)}
	{...restProps}
/>
