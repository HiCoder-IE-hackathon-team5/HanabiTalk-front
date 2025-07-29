export const setCookie = (name: string, value: string) => {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/`;
};

export const getCookie = (name: string): string | null => {
	const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
	return match ? decodeURIComponent(match[2]) : null;
};

export const deleteCookie = (name: string) => {
	document.cookie = `${name}=; Max-Age=0; path=/`;
};
