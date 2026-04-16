import Root from './tabs.svelte';
import Content from './tabs-content.svelte';
import List, {
	tabsListVariants,
	type TabsListVariant,
	type TabsListColor,
	type TabsListSize
} from './tabs-list.svelte';
import Trigger, { type TabsTriggerColor } from './tabs-trigger.svelte';

export {
	Root,
	Content,
	List,
	Trigger,
	tabsListVariants,
	type TabsListVariant,
	type TabsListColor,
	type TabsListSize,
	type TabsTriggerColor,
	//
	Root as Tabs,
	Content as TabsContent,
	List as TabsList,
	Trigger as TabsTrigger
};
