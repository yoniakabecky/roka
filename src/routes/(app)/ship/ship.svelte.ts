import Papa from 'papaparse';
import Encoding from 'encoding-japanese';
import { SvelteMap } from 'svelte/reactivity';
import { toast } from 'svelte-sonner';
import { loadSender, isSenderComplete, type SenderProfile } from '$lib/ship/sender';
import { deduplicateOrders, SHOPIFY_FIELDS } from '$lib/ship/shopify';
import { mapToYupack, buildYupackCsv, type AddressOverride } from '$lib/ship/yupack';
import { downloadBlob } from '$lib/download';

export type { AddressOverride };

const createShip = () => {
	let sender = $state<SenderProfile>(loadSender());
	let orders = $state<Record<string, string>[]>([]);
	let filename = $state('');
	let loading = $state(false);
	let exporting = $state(false);
	let addressOverrides = new SvelteMap<string, AddressOverride>();

	const handleFile = (file: File) => {
		loading = true;
		orders = [];
		filename = '';
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			Papa.parse<Record<string, string>>(text, {
				header: true,
				skipEmptyLines: true,
				dynamicTyping: false,
				complete: (result) => {
					orders = deduplicateOrders(result.data.filter((r) => r != null));
					filename = file.name;
					loading = false;
				},
				error: () => {
					loading = false;
					toast.error(`Failed to parse ${file.name}`);
				}
			});
		};
		reader.onerror = () => {
			loading = false;
			toast.error(`Failed to parse ${file.name}`);
		};
		reader.readAsText(file, 'utf-8');
	};

	const setAddressOverride = (orderName: string, data: AddressOverride | null) => {
		if (data) {
			addressOverrides.set(orderName, data);
		} else {
			addressOverrides.delete(orderName);
		}
	};

	const exportYupack = () => {
		if (!isSenderComplete(sender)) {
			toast.warning('The sender information is incomplete. Please fill in the required fields.');
			return;
		}
		exporting = true;
		try {
			const yupackRows = orders.map((o) =>
				mapToYupack(o, sender, addressOverrides.get(o[SHOPIFY_FIELDS.NAME]))
			);
			const csvStr = buildYupackCsv(yupackRows);
			const sjisArray = Encoding.convert(Encoding.stringToCode(csvStr), {
				to: 'SJIS',
				from: 'UNICODE'
			});
			const blob = new Blob([new Uint8Array(sjisArray)], { type: 'text/csv;charset=shift_jis' });
			const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
			const dlFilename = `yupack_${dateStr}.csv`;
			downloadBlob(blob, dlFilename);
			toast.success(`Exported ${dlFilename}`);
		} catch {
			toast.error('Export failed');
		} finally {
			exporting = false;
		}
	};

	const clear = () => {
		orders = [];
		filename = '';
		addressOverrides.clear();
	};

	return {
		get sender() {
			return sender;
		},
		set sender(v) {
			sender = v;
		},
		get orders() {
			return orders;
		},
		get filename() {
			return filename;
		},
		get loading() {
			return loading;
		},
		get exporting() {
			return exporting;
		},
		get addressOverrides() {
			return addressOverrides;
		},
		handleFile,
		exportYupack,
		setAddressOverride,
		clear
	};
};

const ship = createShip();
export const useShip = () => ship;
