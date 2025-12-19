export const parseCookies = (headers: Headers) => {
	const list: { [key: string]: string } = {};
	const cookieHeader = headers.get('cookie');

	if (!cookieHeader) return list;

	cookieHeader.split(';').forEach((cookie) => {
		let [name, ...rest] = cookie.split('=');
		name = name?.trim();
		if (!name) return;

		const value = rest.join('=').trim();

		list[name] = decodeURIComponent(value);
	});

	return list;
};
