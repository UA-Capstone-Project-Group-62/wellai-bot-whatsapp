const pino = require('pino');
const { env } = require('./env');

const isProduction = env.nodeEnv === 'production';
const shouldPrettyLog =
	env.logPretty === 'true' || (!isProduction && env.logPretty !== 'false');

const transport = shouldPrettyLog
	? pino.transport({
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'SYS:standard',
				ignore: 'pid,hostname',
			},
		})
	: undefined;

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
