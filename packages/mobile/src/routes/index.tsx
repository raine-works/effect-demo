import { client } from '@mobile/lib/rpcClient';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function TabOneScreen() {
	const controller = new AbortController();

	const getUserList = async () => {
		const res = await client.api.user.$post(
			{ json: { name: 'Test User', email: 'test2@test.com' } },
			{ init: { signal: controller.signal } }
		);
		const users = await res.json();

		console.log(users);
	};

	useEffect(() => {
		getUserList();

		return () => {
			controller.abort();
		};
	}, []);

	return (
		<View>
			<Text>Hello World!</Text>
		</View>
	);
}
