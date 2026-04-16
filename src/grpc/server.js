const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { ReflectionService } = require('@grpc/reflection');
const { env } = require('../lib/env');
const { logger } = require('../lib/logger');
const { sendHandler } = require('./handlers/send-handler');

const PROTO_ROOT = path.resolve(__dirname, '..', '..', 'proto');
const BOT_PROTO_PATH = path.join(PROTO_ROOT, 'proto', 'bot', 'bot.proto');

function loadBotService() {
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

	return { packageDefinition, botProto };
}

async function startGrpcServer() {
	const { packageDefinition, botProto } = loadBotService();
	const server = new grpc.Server();

	server.addService(botProto.BotService.service, {
		send: sendHandler,
	});

	const reflection = new ReflectionService(packageDefinition);
	reflection.addToServer(server);

	await new Promise((resolve, reject) => {
		server.bindAsync(
			`0.0.0.0:${env.grpcPort}`,
			grpc.ServerCredentials.createInsecure(),
			(err) => {
				if (err) {
					reject(err);
					return;
				}

				resolve();
			},
		);
	});

	logger.info({ port: env.grpcPort }, 'Bot gRPC server listening');
	return server;
}

module.exports = {
	startGrpcServer,
};
