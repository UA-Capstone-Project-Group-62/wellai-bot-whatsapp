const { logger } = require('../../lib/logger');
const { getMessages } = require('../../lib/db');

async function getMessagesHandler(call, callback) {
	const { user_id, count } = call.request;

	if (!user_id || !count) {
		logger.warn({ user_id, count }, 'Invalid BotService.GetMessages request');
		callback(null, { messages: [] });
		return;
	}

	logger.info({ user_id, count }, 'BotService.GetMessages request received');

	try {
		const messages = await getMessages(user_id, count);
		logger.info(
			{ user_id, count: messages.length },
			'Returning messages from database',
		);
		callback(null, { messages });
	} catch (error) {
		logger.error({ err: error }, 'Error fetching messages from database');
		callback(null, { messages: [] });
	}
}

module.exports = {
	getMessagesHandler,
};
