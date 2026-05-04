export const navLinks = [
	{ path: '/csv-studio' as const, label: 'CSV Studio' },
	{ path: '/ship' as const, label: 'Ship It' }
] satisfies { path: string; label: string }[];

export type NavLink = (typeof navLinks)[number];
