const STORAGE_KEY = 'roka_sender';

export type SenderProfile = {
	zipcode: string;
	address: string;
	address2: string;
	name: string;
	phone: string;
	email: string;
};

const initialProfile: SenderProfile = {
	zipcode: '',
	address: '',
	address2: '',
	name: '',
	phone: '',
	email: ''
};

export const loadSender = (): SenderProfile => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...initialProfile };
		return { ...initialProfile, ...JSON.parse(raw) };
	} catch {
		return { ...initialProfile };
	}
};

export const saveSender = (profile: SenderProfile): void => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};

export const isSenderComplete = (profile: SenderProfile): boolean =>
	!!(profile.zipcode && profile.address && profile.name && profile.phone);
