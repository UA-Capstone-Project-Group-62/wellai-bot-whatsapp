// Import Express.js
const express = require('express');
const axios = require('axios');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// 🔑 CONFIG (loaded from environment)
const PORT = process.env.WHATSAPP_PORT || 5000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// ✅ Route for GET requests (Webhook verification)
app.get('/webhook', (req, res) => {
	const token = req.query['hub.verify_token'];
	const challenge = req.query['hub.challenge'];

	console.log('VERIFY REQUEST RECEIVED');
	console.log('Token:', token);
	console.log('Challenge:', challenge);

	if (token === VERIFY_TOKEN) {
		return res.status(200).send(challenge);
	} else {
		return res.status(403).send('Invalid token');
	}
});

// ✅ Route for POST requests (Receive + Reply)
app.post('/webhook', async (req, res) => {
	const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

	console.log(`\n\nWebhook received ${timestamp}\n`);
	console.log(JSON.stringify(req.body, null, 2));

	try {
		const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

		if (message) {
			const from = message.from; // user number
			const text = message.text?.body;

			console.log('User:', from);
			console.log('Message:', text);

			// 🔁 SEND SAME MESSAGE BACK (ECHO)
			await axios.post(
				`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
				{
					messaging_product: 'whatsapp',
					to: from,
					text: { body: text },
				},
				{
					headers: {
						Authorization: `Bearer ${ACCESS_TOKEN}`,
						'Content-Type': 'application/json',
					},
				},
			);

			console.log('Reply sent');
		}
	} catch (error) {
		console.error(
			'Error sending message:',
			error.response?.data || error.message,
		);
	}

	res.status(200).send('EVENT_RECEIVED');
});

// Start the server
app.listen(PORT, () => {
	console.log(`\nListening on port ${PORT}\n`);
});
