const pino = require('pino');
const { env } = require('./env');

const isProduction = env.nodeEnv === 'production';
const shouldPrettyLog =
	env.logPretty === 'true' || (!isProduction && env.logPretty !== 'false');

let transport;
if (shouldPrettyLog) {
	try {
		transport = pino.transport({
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'SYS:standard',
				ignore: 'pid,hostname',
			},
		});
	} catch {
		// pino-pretty may not be installed in production; fall back to default JSON logging.
		transport = undefined;
	}
}

const logger = pino(
	{
		level: env.logLevel,
		base: undefined,
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transport,
);

module.exports = {
	logger,
};
