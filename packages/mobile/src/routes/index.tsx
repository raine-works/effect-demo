import { client } from '@mobile/lib/rpcClient';
import { tryCatch } from '@tools/lib/tryCatch';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

type UserList = Extract<
	Awaited<ReturnType<Awaited<ReturnType<typeof client.api.user.$get>>['json']>>,
	{ page: number }
>;

export default function TabOneScreen() {
	const controller = new AbortController();
	const [users, setUsers] = useState<UserList | null>(null);

	const getUserList = async () => {
		const { error, data } = await tryCatch(
			client.api.user.$get({ query: { page: '1', pageSize: '30' } }, { init: { signal: controller.signal } })
		);

		if (error) {
			return console.error(error.message);
		}

		if (data.status === 200) {
			const userList = await data.json();
			setUsers(userList);
		}
	};

	useEffect(() => {
		getUserList();

		return () => {
			controller.abort();
		};
	}, []);

	return (
		<View>
			{users?.records.map((record, key) => {
				return <Text key={key}>{record.name}</Text>;
			})}
			<Link href="https://google.com">Test</Link>
		</View>
	);
}
