import { base } from '@server/lib/orpc';
import { authContract } from '@server/routes/auth';
import { userContract } from '@server/routes/user';

export const contract = base.router({
	auth: authContract,
	user: userContract
});
