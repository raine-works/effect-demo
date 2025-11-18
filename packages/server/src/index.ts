import { HttpRouter, HttpServer, HttpServerResponse } from '@effect/platform';
import { BunHttpServer, BunRuntime } from '@effect/platform-bun';
import { Layer } from 'effect';

const router = HttpRouter.empty.pipe(
	HttpRouter.get('/', HttpServerResponse.text('Hello World')),
	HttpRouter.get('/ping', HttpServerResponse.text('pong'))
);

const app = router.pipe(HttpServer.serve(), HttpServer.withLogAddress);

const ServerLive = BunHttpServer.layer({ port: Bun.env.PORT });

BunRuntime.runMain(Layer.launch(Layer.provide(app, ServerLive)));
