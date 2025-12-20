import { tryCatch } from '@effect-demo/tools/lib/tryCatch';
import { storage } from '@mobile/lib/localStorage';
import { rpcClient } from '@mobile/lib/rpcClient';
import { View } from 'react-native';

export default function TabOneScreen() {
	const controller = new AbortController();

	const login = async () => {
		const client = await rpcClient();
		const { error, data } = await tryCatch(
			client.auth.login({ email: 'raine@raineworks.com' }, { signal: controller.signal })
		);

		if (error) {
			console.error(error);
			return;
		}

		await storage.local.set('accessToken', data.accessToken);
		await storage.local.set('refreshToken', data.refreshToken);
	};

	const getAllUsers = async () => {
		const client = await rpcClient();
		const { error, data } = await tryCatch(
			client.user.getAllUsers({ page: 1, pageSize: 30 }, { signal: controller.signal })
		);

		if (error) {
			console.error(error);
			return;
		}

		console.log(data);
	};

	return (
		<View>
			<button type="button" onClick={login}>
				Login
			</button>

			<button type="button" onClick={getAllUsers}>
				Get Users
			</button>
		</View>
	);
}
