import { pluginQRCode } from '@lynx-js/qrcode-rsbuild-plugin';
import { pluginReactLynx } from '@lynx-js/react-rsbuild-plugin';
import { defineConfig } from '@lynx-js/rspeedy';
import { pluginTypeCheck } from '@rsbuild/plugin-type-check';

export default defineConfig({
	plugins: [
		pluginQRCode({
			schema(href) {
				const url = new URL(href);
				const HOST_IP = process.env.HOST_IP;
				if (HOST_IP) url.host = HOST_IP;
				return `${url.href}?fullscreen=true`;
			}
		}),
		pluginReactLynx(),
		pluginTypeCheck()
	]
});
