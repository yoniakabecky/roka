/// <reference types="@cloudflare/workers-types" />

type ZipcloudResult = {
	address1: string;
	address2: string;
	address3: string;
};

type ZipcloudResponse = {
	status: number;
	results: ZipcloudResult[] | null;
};

export const onRequestGet: PagesFunction = async ({ request }) => {
	const zip = new URL(request.url).searchParams.get('zip') ?? '';
	if (!/^\d{7}$/.test(zip)) {
		return Response.json({ error: 'invalid_zip' }, { status: 400 });
	}

	const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
	if (!res.ok) {
		return Response.json({ error: 'network' }, { status: 502 });
	}

	const data = (await res.json()) as ZipcloudResponse;
	const first = data.results?.[0];
	if (!first) {
		return Response.json({ error: 'not_found' }, { status: 404 });
	}

	return Response.json({ address: first.address1 + first.address2 + first.address3 });
};
