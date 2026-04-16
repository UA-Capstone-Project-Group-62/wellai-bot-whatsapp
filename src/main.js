const path = require('path');
require('dotenv').config();
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { ReflectionService } = require('@grpc/reflection');

const PORT = process.env.GRPC_PORT || '50051';
const PROTO_ROOT = path.resolve(__dirname, '..', 'proto');
const BOT_PROTO_PATH = path.join(PROTO_ROOT, 'proto', 'bot', 'bot.proto');

const packageDefinition = protoLoader.loadSync(BOT_PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true,
	includeDirs: [PROTO_ROOT],
});

const loadedProto = grpc.loadPackageDefinition(packageDefinition);
const botProto = loadedProto.wellai_bot?.bot;

if (!botProto?.BotService) {
	throw new Error('Failed to load wellai_bot.bot.BotService from bot.proto');
}

function send(call, callback) {
	const { user_id, content } = call.request;

	if (!user_id || !content) {
		callback(null, {
			success: false,
			message: 'user_id and content are required',
		});
		return;
	}

	console.log(`[BotService.Send] user_id=${user_id} content=${content}`);

	callback(null, {
		success: true,
		message: `Message accepted for user ${user_id}`,
	});
}

function startServer() {
	const server = new grpc.Server();
	server.addService(botProto.BotService.service, { send });

	const reflection = new ReflectionService(packageDefinition);
	reflection.addToServer(server);

	server.bindAsync(
		`0.0.0.0:${PORT}`,
		grpc.ServerCredentials.createInsecure(),
		(err) => {
			if (err) {
				console.error('Failed to bind gRPC server:', err);
				process.exit(1);
			}

			console.log(`Bot gRPC server listening on 0.0.0.0:${PORT}`);
		},
	);

	const shutdown = () => {
		console.log('Shutting down gRPC server...');
		server.tryShutdown(() => process.exit(0));
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

startServer();
