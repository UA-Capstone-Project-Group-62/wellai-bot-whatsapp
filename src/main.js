const { startGrpcServer } = require('./grpc/server');
const { startWhatsappServer } = require('./whatsapp/server');
const { logger } = require('./lib/logger');
const { env } = require('./lib/env');
const { connect, seedUsers, close: closeDb } = require('./lib/db');

async function start() {
	logger.info({ env }, 'Starting application with configuration');

	await connect();
	await seedUsers();

	const grpcServer = await startGrpcServer();
	const whatsappHttpServer = startWhatsappServer();

	const shutdown = async () => {
		logger.info('Shutting down servers...');

		whatsappHttpServer.close(() => {
			grpcServer.tryShutdown(async () => {
				await closeDb();
				process.exit(0);
			});
		});
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);
}

start().catch((error) => {
	logger.error({ err: error }, 'Failed to start application');
	process.exit(1);
});