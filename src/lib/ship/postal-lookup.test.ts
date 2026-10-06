import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupPostalCode } from './postal-lookup';

const fetchMock = vi.fn();

const respond = (status: number, body: unknown) =>
	fetchMock.mockResolvedValueOnce(Response.json(body, { status }));

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

describe('lookupPostalCode', () => {
	it('calls the postal lookup API with the zip code', async () => {
		respond(200, { address: '東京都渋谷区神宮前' });
		await lookupPostalCode('1500001');
		expect(fetchMock).toHaveBeenCalledWith('/api/postal-lookup?zip=1500001');
	});

	it('returns the address on success', async () => {
		respond(200, { address: '東京都渋谷区神宮前' });
		expect(await lookupPostalCode('1500001')).toEqual({ ok: true, address: '東京都渋谷区神宮前' });
	});

	it('returns not_found when the API says not_found', async () => {
		respond(404, { error: 'not_found' });
		expect(await lookupPostalCode('0000000')).toEqual({ ok: false, error: 'not_found' });
	});

	it('returns network for other API errors', async () => {
		respond(400, { error: 'invalid_zip' });
		expect(await lookupPostalCode('abc')).toEqual({ ok: false, error: 'network' });
	});

	it('returns network when a 200 response has no address', async () => {
		respond(200, {});
		expect(await lookupPostalCode('1500001')).toEqual({ ok: false, error: 'network' });
	});

	it('returns network when fetch throws', async () => {
		fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
		expect(await lookupPostalCode('1500001')).toEqual({ ok: false, error: 'network' });
	});

	it('returns network when the response is not JSON', async () => {
		fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 502 }));
		expect(await lookupPostalCode('1500001')).toEqual({ ok: false, error: 'network' });
	});
});
