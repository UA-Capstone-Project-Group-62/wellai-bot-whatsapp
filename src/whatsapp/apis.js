const axios = require('axios');
const { env } = require('../lib/env');

const WHATSAPP_GRAPH_API_VERSION = 'v18.0';

const whatsappApi = axios.create({
	baseURL: `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}`,
	headers: {
		Authorization: `Bearer ${env.whatsappAccessToken}`,
		'Content-Type': 'application/json',
	},
});

async function sendWhatsappTextMessage({ to, text }) {
	const response = await whatsappApi.post(
		`/${env.whatsappPhoneNumberId}/messages`,
		{
			messaging_product: 'whatsapp',
			to,
			text: { body: text },
		},
	);

	return response.data;
}

async function getConversationMessages(conversationId, count) {
	let allMessages = [];
	let cursor = null;

	while (allMessages.length < count) {
		const params = {
			limit: Math.min(count - allMessages.length, 50),
		};
		if (cursor) {
			params.after = cursor;
		}

		const response = await whatsappApi.get(
			`/${env.whatsappPhoneNumberId}/conversations/${conversationId}/messages`,
			{ params },
		);

		const messages = response.data?.data || [];
		if (messages.length === 0) break;

		allMessages.push(...messages);
		cursor = response.data?.paging?.cursors?.after;

		if (!cursor) break;
	}

	return allMessages.slice(0, count);
}

async function sendWhatsappInteractiveMessage({ to, bodyText, buttons }) {
	const response = await whatsappApi.post(
		`/${env.whatsappPhoneNumberId}/messages`,
		{
			messaging_product: 'whatsapp',
			to,
			type: 'interactive',
			interactive: {
				type: 'button',
				body: { text: bodyText },
				action: {
					buttons: buttons.map((b) => ({
						type: 'reply',
						reply: { id: b.id, title: b.title },
					})),
				},
			},
		},
	);

	return response.data;
}

module.exports = {
	sendWhatsappTextMessage,
	sendWhatsappInteractiveMessage,
	getConversationMessages,
};
