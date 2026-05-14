const fs = require('fs');
const path = require('path');
const { logger } = require('../lib/logger');
const { sendAgentMessage } = require('../grpc/agent-client');
const { addUserIfNotExists, setTermsAccepted, storeMessage } = require('../lib/db');
const { sendWhatsappTextMessage } = require('./apis');
const { env } = require('../lib/env');

async function getTermsConditionsText() {
	const filePath = path.resolve(__dirname, '..', '..', env.termsConditionsPath);
	return fs.readFileSync(filePath, 'utf8');
}

async function processIncomingWhatsappMessage({ from, text, rawMessage }) {
	logger.info(
		{ from, text: text || '', messageId: rawMessage?.id || '' },
		'Inbound WhatsApp message received for processing',
	);

	if (!from) {
		logger.warn(
			{ from, messageId: rawMessage?.id || '' },
			'Skipping message due to missing from field',
		);
		return;
	}

	const termsAccepted = await addUserIfNotExists(from);

	if (!termsAccepted) {
		const termsText = await getTermsConditionsText();
		await sendWhatsappTextMessage({ to: from, text: termsText });
		await setTermsAccepted(from, true);
		await storeMessage(from, termsText, true);
		logger.info({ from }, 'Terms & conditions sent and marked as accepted');

		if (!text) {
			return;
		}
	}

	if (!text) {
		logger.warn(
			{ from, hasText: Boolean(text), messageId: rawMessage?.id || '' },
			'Skipping AgentService.Receive due to missing text field',
		);
		return;
	}

	await storeMessage(from, text, false);

	const response = await sendAgentMessage({
		user_id: from,
		content: text,
	});

	if (response?.message) {
		await storeMessage(from, response.message, true);
		await sendWhatsappTextMessage({ to: from, text: response.message });
	}

	logger.info(
		{ from, success: response?.success, message: response?.message },
		'AgentService.Receive call completed',
	);
}

module.exports = {
	processIncomingWhatsappMessage,
};