const axios = require('axios');
const { env } = require('../lib/env');

const WHATSAPP_GRAPH_API_VERSION = 'v18.0';

async function sendWhatsappTextMessage({ to, text }) {
	const response = await axios.post(
		`https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${env.whatsappPhoneNumberId}/messages`,
		{
			messaging_product: 'whatsapp',
			to,
			text: { body: text },
		},
		{
			headers: {
				Authorization: `Bearer ${env.whatsappAccessToken}`,
				'Content-Type': 'application/json',
			},
		},
	);

	return response.data;
}

module.exports = {
	sendWhatsappTextMessage,
};
