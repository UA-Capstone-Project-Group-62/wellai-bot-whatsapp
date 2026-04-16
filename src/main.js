const { startGrpcServer } = require('./grpc/server');
const { startWhatsappServer } = require('./whatsapp/server');
const { logger } = require('./lib/logger');

async function start() {
	const grpcServer = await startGrpcServer();
	const whatsappHttpServer = startWhatsappServer();

	const shutdown = () => {
		logger.info('Shutting down servers...');

		whatsappHttpServer.close(() => {
			grpcServer.tryShutdown(() => process.exit(0));
		});
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

start().catch((error) => {
	logger.error({ err: error }, 'Failed to start application');
	process.exit(1);
});
