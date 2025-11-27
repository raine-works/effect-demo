import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { client } from '@/lib/rpcClient';

// type UserList = Awaited<Awaited<ReturnType<typeof client.api.user.$get>>['json']>;

// const [userList, setUserList] = useState<JSONValue | null>(null);

const getUserList = async () => {
	const abortController = new AbortController();

	const res = await client.api.user.$post(
		{ json: { name: 'Test User', email: 'test2@test.com' } },
		{ init: { signal: abortController.signal } }
	);
	const users = await res.json();

	console.log(users);

	// setUserList(users);
};

useEffect(() => {
	getUserList();
}, []);

export default function TabOneScreen() {
	return (
		<View>
			<Text>Hello World!</Text>
			{/* <Text>{userList?.toString()}</Text> */}
		</View>
	);
}
