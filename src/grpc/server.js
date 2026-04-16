const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { ReflectionService } = require('@grpc/reflection');
const { env } = require('../lib/env');
const { logger } = require('../lib/logger');
const { sendWhatsappTextMessage } = require('../whatsapp/apis');

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

async function sendHandler(call, callback) {
	const { user_id, content } = call.request;

	if (!user_id || !content) {
		logger.warn(
			{ user_id, hasContent: Boolean(content) },
			'Invalid BotService.Send request',
		);
		callback(null, {
			success: false,
			message: 'user_id and content are required',
		});
		return;
	}

	logger.info({ user_id, content }, 'BotService.Send request received');

	try {
		await sendWhatsappTextMessage({ to: user_id, text: content });
		callback(null, {
			success: true,
			message: `Message sent to user ${user_id}`,
		});
	} catch (error) {
		logger.error(
			{ err: error, response: error.response?.data },
			'Error sending WhatsApp message from gRPC',
		);
		callback(null, {
			success: false,
			message: 'Failed to send message to WhatsApp',
		});
	}
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
