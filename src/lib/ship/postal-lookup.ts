export type PostalLookupResult =
	| { ok: true; address: string }
	| { ok: false; error: 'not_found' | 'network' };

export const lookupPostalCode = async (zip: string): Promise<PostalLookupResult> => {
	try {
		const res = await fetch(`/api/postal-lookup?zip=${zip}`);
		const body = (await res.json()) as { address?: string; error?: string };
		if (!res.ok || !body.address) {
			return { ok: false, error: body.error === 'not_found' ? 'not_found' : 'network' };
		}
		return { ok: true, address: body.address };
	} catch {
		return { ok: false, error: 'network' };
	}
};
