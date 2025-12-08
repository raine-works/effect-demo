// import { client } from '@mobile/lib/rpcClient';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function TabOneScreen() {
	const controller = new AbortController();
	const [value, setValue] = useState<string | null>(null);

	const getUserList = async () => {
		// const test = await client.test1;
		setValue('Hello World');
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
