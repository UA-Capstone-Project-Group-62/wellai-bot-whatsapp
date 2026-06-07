const { logger } = require('../lib/logger');
const { getCollection } = require('../lib/db');

function parseCount(value) {
	const count = Number.parseInt(value || '20', 10);

	if (!Number.isFinite(count) || count <= 0) {
		return 20;
	}

	return Math.min(count, 100);
}

function createClientMessage(input) {
	const now = new Date();

	return {
		id: `msg_${Date.now()}`,
		clientId: input.clientId || null,
		clientName: input.clientName || input.patientName || null,
		phoneNumber: String(input.phoneNumber),
		appointmentId: input.appointmentId || null,
		appointmentTime: input.appointmentTime || null,
		doctorName: input.doctorName || null,
		clinicName: input.clinicName || null,
		message: input.message,
		status: input.status || 'new',
		createdAt: now,
		updatedAt: now,
	};
}

async function saveClientMessage(input) {
	const collection = await getCollection('client_messages');
	const newMessage = createClientMessage(input);

	await collection.insertOne(newMessage);
	logger.info(
		{ phoneNumber: newMessage.phoneNumber, messageId: newMessage.id },
		'Client message saved to MongoDB',
	);

	return newMessage;
}

async function getClientMessages({ phoneNumber, count = 20 } = {}) {
	const collection = await getCollection('client_messages');
	const query = phoneNumber ? { phoneNumber: String(phoneNumber) } : {};

	return collection
		.find(query, { projection: { _id: 0 } })
		.sort({ createdAt: -1 })
		.limit(count)
		.toArray();
}

function registerClientMessageRoutes(app) {
	app.use((req, res, next) => {
		const isClientMessageRoute =
			req.path === '/health' ||
			req.path === '/client-message' ||
			req.path === '/client-messages' ||
			req.path.startsWith('/client-message/') ||
			req.path.startsWith('/client-messages/');

		if (isClientMessageRoute) {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
			res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
		}

		if (isClientMessageRoute && req.method === 'OPTIONS') {
			return res.sendStatus(204);
		}

		return next();
	});

	app.get('/health', (req, res) => {
		res.status(200).json({
			success: true,
			message: 'WellAI WhatsApp service is running',
			time: new Date().toISOString(),
		});
	});

	app.post(['/client-message', '/client-messages'], async (req, res) => {
		try {
			const body = req.body || {};

			if (!body.phoneNumber) {
				return res.status(400).json({
					success: false,
					error: 'phoneNumber is required',
				});
			}

			if (!body.message) {
				return res.status(400).json({
					success: false,
					error: 'message is required',
				});
			}

			const newMessage = await saveClientMessage(body);

			return res.status(201).json({
				success: true,
				message: 'Client message saved successfully',
				data: newMessage,
			});
		} catch (error) {
			logger.error({ err: error }, 'Error saving client message');
			return res.status(500).json({
				success: false,
				error: 'Failed to save client message',
			});
		}
	});

	app.get(
		[
			'/client-message',
			'/client-messages',
			'/client-message/:phoneNumber',
			'/client-messages/:phoneNumber',
		],
		async (req, res) => {
			try {
				const phoneNumber = req.query.phoneNumber || req.params.phoneNumber;
				const count = parseCount(req.query.count);
				const messages = await getClientMessages({ phoneNumber, count });

				return res.status(200).json({
					success: true,
					total: messages.length,
					data: messages,
				});
			} catch (error) {
				logger.error({ err: error }, 'Error fetching client messages');
				return res.status(500).json({
					success: false,
					error: 'Failed to fetch client messages',
				});
			}
		},
	);
}

module.exports = {
	registerClientMessageRoutes,
};
