const { logger } = require('../lib/logger');

async function processIncomingWhatsappMessage({ from, text, rawMessage }) {
	logger.info(
		{ from, text: text || '', messageId: rawMessage?.id || '' },
		'Inbound WhatsApp message received for processing',
	);

	// TODO: hook your business logic here.
}

module.exports = {
	processIncomingWhatsappMessage,
};
