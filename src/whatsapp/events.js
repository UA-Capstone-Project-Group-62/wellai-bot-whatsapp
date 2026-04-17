const { logger } = require('../lib/logger');
const { sendAgentMessage } = require('../grpc/agent-client');

async function processIncomingWhatsappMessage({ from, text, rawMessage }) {
	logger.info(
		{ from, text: text || '', messageId: rawMessage?.id || '' },
		'Inbound WhatsApp message received for processing',
	);

	if (!from || !text) {
		logger.warn(
			{ from, hasText: Boolean(text), messageId: rawMessage?.id || '' },
			'Skipping AgentService.Receive due to missing required message fields',
		);
		return;
	}

	const response = await sendAgentMessage({
		user_id: from,
		content: text,
	});

	logger.info(
		{ from, success: response?.success, message: response?.message },
		'AgentService.Receive call completed',
	);
}

module.exports = {
	processIncomingWhatsappMessage,
};
