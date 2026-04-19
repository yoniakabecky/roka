import Papa from 'papaparse';
import { toast } from 'svelte-sonner';
import { exportCsv } from '$lib/csv-studio/export-csv';
import { exportPdf } from '$lib/csv-studio/export-pdf';
import {
	isLikelyDate,
	buildColumnIndex,
	computeFilteredRows,
	computeCrossFilteredValues,
	type FullIndex
} from '$lib/csv-studio/detect-columns';

const LOCALE_SORT_OPTS: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };
const MAX_SAVED_FILTERS = 10;
const STORAGE_KEY = 'csv-studio-saved-filters';

export type SavedFilter = {
	name: string;
	colFilters: Record<string, string[]>;
	colDateFilters: Record<string, { from: string; to: string }>;
	colVisible: Record<string, boolean>;
};

const createCsvStudio = () => {
	let columns = $state<string[]>([]);
	let rows = $state<Record<string, string>[]>([]);
	let columnIndex = $state<FullIndex>(new Map());
	let colVisible = $state<Record<string, boolean>>({});
	let colFiltersOpen = $state<Record<string, boolean>>({});
	let colFilters = $state<Record<string, string[]>>({});
	let colDateFilters = $state<Record<string, { from: string; to: string }>>({});
	let colEmptyFilters = $state<Record<string, 'empty' | 'nonempty' | null>>({});
	let colRename = $state<Record<string, string>>({});
	let loading = $state(false);
	let filename = $state('');
	let filteredRows = $state<Record<string, string>[]>([]);
	let filtering = $state(false);
	let sortCol = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');
	let savedFilters = $state<SavedFilter[]>(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));

	type AppliedSnapshot = {
		name: string;
		colFilters: Record<string, string[]>;
		colDateFilters: Record<string, { from: string; to: string }>;
		colVisible: Record<string, boolean>;
	};

	let appliedSnapshot = $state<AppliedSnapshot | null>(null);

	const isPresetModified = $derived.by(() => {
		if (!appliedSnapshot) return false;
		for (const col of columns) {
			const saved = [...(appliedSnapshot.colFilters[col] ?? [])].sort();
			const current = [...(colFilters[col] ?? [])].sort();
			if (saved.length !== current.length || saved.some((v, i) => v !== current[i])) return true;
			const savedDate = appliedSnapshot.colDateFilters[col] ?? { from: '', to: '' };
			const currentDate = colDateFilters[col] ?? { from: '', to: '' };
			if (savedDate.from !== currentDate.from || savedDate.to !== currentDate.to) return true;
			if ((appliedSnapshot.colVisible[col] ?? true) !== (colVisible[col] ?? true)) return true;
		}
		return false;
	});

	const visibleColumns = $derived(columns.filter((c) => colVisible[c]));

	const hasHiddenColumns = $derived(visibleColumns.length < columns.length);

	const activeFilters = $derived(Object.entries(colFilters).filter(([, vals]) => vals.length > 0));

	const activeDateFilters = $derived(
		Object.entries(colDateFilters).filter(([, { from, to }]) => from !== '' || to !== '')
	);

	const activeEmptyFilters = $derived(
		Object.entries(colEmptyFilters).filter(([, v]) => v !== null) as [
			string,
			'empty' | 'nonempty'
		][]
	);

	const dateColumns = $derived(
		new Set(columns.filter((c) => isLikelyDate([...(columnIndex.get(c)?.keys() ?? [])])))
	);

	const colAvailableValues = $derived(
		Object.fromEntries(
			columns
				.filter((c) => colFiltersOpen[c])
				.map((c) => [
					c,
					computeCrossFilteredValues(
						c,
						rows,
						columnIndex,
						activeFilters,
						activeDateFilters,
						activeEmptyFilters
					)
				])
		)
	);

	const exportStem = $derived((filename.replace(/\.[^.]+$/, '') || 'export') + '_roka');

	const sortedRows = $derived.by(() => {
		const col = sortCol;
		if (!col) return filteredRows;
		return [...filteredRows].sort((a, b) => {
			const av = a[col] ?? '';
			const bv = b[col] ?? '';
			const an = Number(av);
			const bn = Number(bv);
			// CSV values are always strings. Use numeric comparison when both parse as
			// numbers ("2" < "10" < "100"), otherwise fall back to localeCompare.
			// The Number() fast-path avoids the cost of localeCompare on numeric columns.
			const cmp =
				!isNaN(an) && !isNaN(bn) ? an - bn : av.localeCompare(bv, undefined, LOCALE_SORT_OPTS);
			return sortDir === 'asc' ? cmp : -cmp;
		});
	});

	$effect.root(() => {
		// When a value or date filter is applied, auto-reset the empty/nonempty tab to "All"
		$effect(() => {
			for (const col of columns) {
				const hasValues = (colFilters[col]?.length ?? 0) > 0;
				const hasDate = colDateFilters[col]?.from || colDateFilters[col]?.to;
				if ((hasValues || hasDate) && colEmptyFilters[col] !== null) {
					colEmptyFilters[col] = null;
				}
			}
		});

		$effect(() => {
			// Snapshot reactive values before the setTimeout boundary — Svelte only
			// tracks reads that happen synchronously within the effect body.
			const activeValueFilters = activeFilters.map(
				([col, vals]) => [col, [...vals]] as [string, string[]]
			);
			const activeDateFiltersCopy = activeDateFilters.map(
				([col, range]) => [col, { ...range }] as [string, { from: string; to: string }]
			);
			const activeEmptyFiltersCopy = activeEmptyFilters.map(
				([col, mode]) => [col, mode] as [string, 'empty' | 'nonempty']
			);
			const currentRows = rows;
			const currentIndex = columnIndex;

			filtering = true;
			const id = setTimeout(() => {
				filteredRows = computeFilteredRows(
					currentRows,
					currentIndex,
					activeValueFilters,
					activeDateFiltersCopy,
					activeEmptyFiltersCopy
				);
				filtering = false;
			}, 0);

			// Cancel the pending computation if filters change before it fires.
			return () => clearTimeout(id);
		});
	});

	const initColumnState = () => {
		colFilters = Object.fromEntries(columns.map((c) => [c, []]));
		colDateFilters = Object.fromEntries(columns.map((c) => [c, { from: '', to: '' }]));
		colEmptyFilters = Object.fromEntries(columns.map((c) => [c, null]));
		colFiltersOpen = {};
		colVisible = Object.fromEntries(columns.map((c) => [c, true]));
	};

	const resetFilters = () => {
		initColumnState();
		appliedSnapshot = null;
	};

	const clearData = () => {
		columns = [];
		rows = [];
		columnIndex = new Map();
		colVisible = {};
		colRename = {};
		filename = '';
		filteredRows = [];
		filtering = false;
		resetFilters();
	};

	const handleFile = (file: File) => {
		filename = file.name;
		loading = true;
		Papa.parse<Record<string, string>>(file, {
			header: true,
			skipEmptyLines: true,
			dynamicTyping: false,
			complete: (result) => {
				columns = result.meta.fields ?? [];
				initColumnState();
				colRename = Object.fromEntries(columns.map((c) => [c, c]));
				rows = result.data.filter((r) => r != null);
				columnIndex = buildColumnIndex(rows, columns);
				filteredRows = rows;
				appliedSnapshot = null;
				loading = false;
				toast.success(`Imported ${filename}`);
			},
			error: () => {
				loading = false;
				toast.error(`Failed to import ${filename}`);
			}
		});
	};

	const resetColRename = () => {
		colRename = Object.fromEntries(columns.map((c) => [c, c]));
	};

	const handleSort = (col: string) => {
		if (sortCol === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortCol = col;
			sortDir = 'asc';
		}
	};

	const doExportCsv = async () => {
		try {
			await exportCsv(sortedRows, visibleColumns, colRename, exportStem);
			toast.success(`Exported ${exportStem}.csv`);
		} catch {
			toast.error(`Failed to export ${exportStem}.csv`);
		}
	};

	const saveCurrentFilter = (name: string): { error?: string } => {
		const isOverwrite = savedFilters.some((f) => f.name === name);
		if (!isOverwrite && savedFilters.length >= MAX_SAVED_FILTERS) {
			return { error: 'Limit reached (10). Delete a preset to save a new one.' };
		}
		const filter: SavedFilter = {
			name,
			colFilters: Object.fromEntries(Object.entries(colFilters).map(([k, v]) => [k, [...v]])),
			colDateFilters: Object.fromEntries(
				Object.entries(colDateFilters).map(([k, v]) => [k, { ...v }])
			),
			colVisible: { ...colVisible }
		};
		savedFilters = [...savedFilters.filter((f) => f.name !== name), filter];
		localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
		appliedSnapshot = {
			name,
			colFilters: Object.fromEntries(Object.entries(colFilters).map(([k, v]) => [k, [...v]])),
			colDateFilters: Object.fromEntries(
				Object.entries(colDateFilters).map(([k, v]) => [k, { ...v }])
			),
			colVisible: { ...colVisible }
		};
		return {};
	};

	const loadSavedFilter = (filter: SavedFilter): { noMatch: boolean } => {
		const newColFilters = Object.fromEntries(columns.map((c) => [c, [] as string[]]));
		const newColDateFilters = Object.fromEntries(columns.map((c) => [c, { from: '', to: '' }]));
		let anyMatch = false;

		for (const [col, vals] of Object.entries(filter.colFilters)) {
			if (!(col in newColFilters)) continue;
			const available = [...(columnIndex.get(col)?.keys() ?? [])];
			const intersected = vals.filter((v) => available.includes(v));
			if (intersected.length > 0) {
				newColFilters[col] = intersected;
				anyMatch = true;
			}
		}

		for (const [col, range] of Object.entries(filter.colDateFilters)) {
			if ((range.from !== '' || range.to !== '') && col in newColDateFilters) {
				newColDateFilters[col] = range;
				anyMatch = true;
			}
		}

		// Columns not in the preset (or presets saved before colVisible was added) default to visible
		const newColVisible = Object.fromEntries(
			columns.map((c) => [c, (filter.colVisible ?? {})[c] ?? true])
		);

		if (Object.values(newColVisible).some((v) => !v)) anyMatch = true;

		colFilters = newColFilters;
		colDateFilters = newColDateFilters;
		colVisible = newColVisible;

		if (anyMatch) {
			appliedSnapshot = {
				name: filter.name,
				colFilters: Object.fromEntries(Object.entries(newColFilters).map(([k, v]) => [k, [...v]])),
				colDateFilters: Object.fromEntries(
					Object.entries(newColDateFilters).map(([k, v]) => [k, { ...v }])
				),
				colVisible: { ...newColVisible }
			};
		}

		return { noMatch: !anyMatch };
	};

	const deleteSavedFilter = (name: string) => {
		savedFilters = savedFilters.filter((f) => f.name !== name);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(savedFilters));
	};

	const doExportPdf = async () => {
		try {
			await exportPdf(sortedRows, visibleColumns, colRename, exportStem);
			toast.success(`Exported ${exportStem}.pdf`);
		} catch {
			toast.error(`Failed to export ${exportStem}.pdf`);
		}
	};

	return {
		get columns() {
			return columns;
		},
		get rows() {
			return rows;
		},
		get colVisible() {
			return colVisible;
		},
		get colFiltersOpen() {
			return colFiltersOpen;
		},
		get colFilters() {
			return colFilters;
		},
		get colDateFilters() {
			return colDateFilters;
		},
		get colEmptyFilters() {
			return colEmptyFilters;
		},
		get colRename() {
			return colRename;
		},
		get loading() {
			return loading;
		},
		get filename() {
			return filename;
		},
		get visibleColumns() {
			return visibleColumns;
		},
		get filteredRows() {
			return filteredRows;
		},
		get colAvailableValues() {
			return colAvailableValues;
		},
		get dateColumns() {
			return dateColumns;
		},
		get exportStem() {
			return exportStem;
		},
		get filtering() {
			return filtering;
		},
		get sortCol() {
			return sortCol;
		},
		get sortDir() {
			return sortDir;
		},
		get sortedRows() {
			return sortedRows;
		},
		get savedFilters() {
			return savedFilters;
		},
		get appliedPresetName() {
			return appliedSnapshot?.name ?? null;
		},
		get isPresetModified() {
			return isPresetModified;
		},
		get activeFilters() {
			return activeFilters;
		},
		get activeDateFilters() {
			return activeDateFilters;
		},
		get activeEmptyFilters() {
			return activeEmptyFilters;
		},
		get hasHiddenColumns() {
			return hasHiddenColumns;
		},
		clearData,
		resetFilters,
		handleFile,
		resetColRename,
		handleSort,
		doExportCsv,
		doExportPdf,
		saveCurrentFilter,
		loadSavedFilter,
		deleteSavedFilter
	};
};

const csvStudio = createCsvStudio();
export const useCsvStudio = () => csvStudio;
