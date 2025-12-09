import { tryCatch } from '@effect-demo/tools';
import { client } from '@mobile/lib/rpcClient';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function TabOneScreen() {
	const controller = new AbortController();
	const [value, setValue] = useState<string | null>(null);

	const getUserList = async () => {
		const { error, data } = await tryCatch(client.test1({ name: 'Raine' }, { signal: controller.signal }));

		if (error) {
			console.error('Error fetching user list:', error);
			return;
		}

		setValue(data.message);
	};

	useEffect(() => {
		getUserList();

		return () => {
			controller.abort();
		};
	}, []);

	return (
		<View>
			<Text>{value}</Text>
		</View>
	);
}
