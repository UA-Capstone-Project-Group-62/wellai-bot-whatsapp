const express = require('express');
const { env } = require('../lib/env');
const { logger } = require('../lib/logger');
const { processIncomingWhatsappMessage } = require('./events');
const { storeConversationId } = require('../lib/db');

function startWhatsappServer() {
	const app = express();
	app.use(express.json());

	app.get('/webhook', (req, res) => {
		const token = req.query['hub.verify_token'];
		const challenge = req.query['hub.challenge'];

		logger.info({ token, challenge }, 'Webhook verification request received');

		if (token === env.whatsappVerifyToken) {
			return res.status(200).send(challenge);
		}

		return res.status(403).send('Invalid token');
	});

	app.post('/webhook', async (req, res) => {
		logger.info({ payload: req.body }, 'Webhook event received');

		try {
			const value = req.body.entry?.[0]?.changes?.[0]?.value;
			const message = value?.messages?.[0];

			if (message) {
				const from = message.from;
				const text = message.text?.body;
				const phoneNumberId = value?.metadata?.phone_number_id;
				const waId = value?.contacts?.[0]?.wa_id;

				if (phoneNumberId && waId) {
					const conversationId = `${phoneNumberId}_${waId}`;
					await storeConversationId(from, conversationId);
				}

				logger.info({ from, text }, 'Inbound WhatsApp message parsed');

				await processIncomingWhatsappMessage({
					from,
					text,
					rawMessage: message,
					rawPayload: req.body,
				});
			}
		} catch (error) {
			logger.error(
				{ err: error, response: error.response?.data },
				'Error processing inbound WhatsApp message',
			);
		}

		res.status(200).send('EVENT_RECEIVED');
	});

	const httpServer = app.listen(env.whatsappPort, () => {
		logger.info(
			{ port: env.whatsappPort },
			'WhatsApp webhook server listening',
		);
	});

	return httpServer;
}

module.exports = {
	startWhatsappServer,
};