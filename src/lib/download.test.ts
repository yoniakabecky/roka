import { describe, it, expect, vi } from 'vitest';
import { downloadBlob } from './download';

describe('downloadBlob', () => {
	it('clicks a temporary link with the blob URL and filename, then revokes the URL', () => {
		const anchor = { href: '', download: '', click: vi.fn() };
		vi.stubGlobal('document', { createElement: vi.fn(() => anchor) });
		const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
		const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		const blob = new Blob(['a,b']);
		downloadBlob(blob, 'out.csv');

		expect(document.createElement).toHaveBeenCalledWith('a');
		expect(createObjectURL).toHaveBeenCalledWith(blob);
		expect(anchor.href).toBe('blob:fake');
		expect(anchor.download).toBe('out.csv');
		expect(anchor.click).toHaveBeenCalledOnce();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
	});
});
