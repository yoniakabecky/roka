import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSender, saveSender, isSenderComplete, type SenderProfile } from './sender';

const COMPLETE: SenderProfile = {
	zipcode: '123-4567',
	address: '東京都渋谷区1-2-3',
	address2: '',
	name: '株式会社ロカ',
	phone: '03-1234-5678',
	email: ''
};

const EMPTY: SenderProfile = {
	zipcode: '',
	address: '',
	address2: '',
	name: '',
	phone: '',
	email: ''
};

const createStorage = () => {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key),
		clear: () => store.clear()
	};
};

beforeEach(() => {
	vi.stubGlobal('localStorage', createStorage());
});

describe('loadSender', () => {
	it('returns an empty profile when nothing is stored', () => {
		expect(loadSender()).toEqual(EMPTY);
	});

	it('returns the stored profile', () => {
		saveSender(COMPLETE);
		expect(loadSender()).toEqual(COMPLETE);
	});

	it('fills missing fields from a partial stored profile', () => {
		localStorage.setItem('roka_sender', JSON.stringify({ name: 'ロカ' }));
		expect(loadSender()).toEqual({ ...EMPTY, name: 'ロカ' });
	});

	it('returns an empty profile when stored JSON is broken', () => {
		localStorage.setItem('roka_sender', '{not json');
		expect(loadSender()).toEqual(EMPTY);
	});

	it('returns a new object each time so callers cannot mutate the default', () => {
		const a = loadSender();
		a.name = 'changed';
		expect(loadSender().name).toBe('');
	});
});

describe('isSenderComplete', () => {
	it('is true when all required fields are filled', () => {
		expect(isSenderComplete(COMPLETE)).toBe(true);
	});

	it('does not require address2 or email', () => {
		expect(isSenderComplete({ ...COMPLETE, address2: '', email: '' })).toBe(true);
	});

	it('is false for an empty profile', () => {
		expect(isSenderComplete(EMPTY)).toBe(false);
	});

	it.each(['zipcode', 'address', 'name', 'phone'] as const)(
		'is false when %s is empty',
		(field) => {
			expect(isSenderComplete({ ...COMPLETE, [field]: '' })).toBe(false);
		}
	);
});
