export const SHOPIFY_FIELDS = {
	NAME: 'Name',
	CREATED_AT: 'Created at',
	SHIPPING_NAME: 'Shipping Name',
	SHIPPING_ZIP: 'Shipping Zip',
	SHIPPING_PHONE: 'Shipping Phone',
	SHIPPING_ADDRESS1: 'Shipping Address1',
	SHIPPING_ADDRESS2: 'Shipping Address2',
	SHIPPING_CITY: 'Shipping City',
	SHIPPING_PROVINCE: 'Shipping Province',
	SHIPPING_METHOD: 'Shipping Method',
	EMAIL: 'Email',
	SUBTOTAL: 'Subtotal',
	TOTAL: 'Total'
} as const;

export const JP_PREFECTURES: Record<string, string> = {
	'JP-01': '北海道',
	'JP-02': '青森県',
	'JP-03': '岩手県',
	'JP-04': '宮城県',
	'JP-05': '秋田県',
	'JP-06': '山形県',
	'JP-07': '福島県',
	'JP-08': '茨城県',
	'JP-09': '栃木県',
	'JP-10': '群馬県',
	'JP-11': '埼玉県',
	'JP-12': '千葉県',
	'JP-13': '東京都',
	'JP-14': '神奈川県',
	'JP-15': '新潟県',
	'JP-16': '富山県',
	'JP-17': '石川県',
	'JP-18': '福井県',
	'JP-19': '山梨県',
	'JP-20': '長野県',
	'JP-21': '岐阜県',
	'JP-22': '静岡県',
	'JP-23': '愛知県',
	'JP-24': '三重県',
	'JP-25': '滋賀県',
	'JP-26': '京都府',
	'JP-27': '大阪府',
	'JP-28': '兵庫県',
	'JP-29': '奈良県',
	'JP-30': '和歌山県',
	'JP-31': '鳥取県',
	'JP-32': '島根県',
	'JP-33': '岡山県',
	'JP-34': '広島県',
	'JP-35': '山口県',
	'JP-36': '徳島県',
	'JP-37': '香川県',
	'JP-38': '愛媛県',
	'JP-39': '高知県',
	'JP-40': '福岡県',
	'JP-41': '佐賀県',
	'JP-42': '長崎県',
	'JP-43': '熊本県',
	'JP-44': '大分県',
	'JP-45': '宮崎県',
	'JP-46': '鹿児島県',
	'JP-47': '沖縄県'
};

export const deduplicateOrders = (rows: Record<string, string>[]): Record<string, string>[] => {
	const seen = new Set<string>();
	return rows.filter((row) => {
		const name = row[SHOPIFY_FIELDS.NAME];
		if (!name || seen.has(name)) return false;
		seen.add(name);
		return true;
	});
};

export const formatShopifyDate = (dateStr: string): string => {
	const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (!match) return '';
	return `${match[1]}${match[2]}${match[3]}`;
};

export const normalizePhone = (phone: string): string => phone.replace(/^'?\+81\s*/, '0');

export const shippingAddressLine1 = (order: Record<string, string>): string =>
	`${JP_PREFECTURES[order[SHOPIFY_FIELDS.SHIPPING_PROVINCE] ?? ''] ?? ''}${order[SHOPIFY_FIELDS.SHIPPING_CITY] ?? ''}${order[SHOPIFY_FIELDS.SHIPPING_ADDRESS1] ?? ''}`;
