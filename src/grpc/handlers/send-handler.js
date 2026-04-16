const { logger } = require('../../lib/logger');
const { sendWhatsappTextMessage } = require('../../whatsapp/apis');

async function sendHandler(call, callback) {
	const { user_id, content } = call.request;

	if (!user_id || !content) {
		logger.warn(
			{ user_id, hasContent: Boolean(content) },
			'Invalid BotService.Send request',
		);
		callback(null, {
			success: false,
			message: 'user_id and content are required',
		});
		return;
	}

	logger.info({ user_id, content }, 'BotService.Send request received');

	try {
		await sendWhatsappTextMessage({ to: user_id, text: content });
		callback(null, {
			success: true,
			message: `Message sent to user ${user_id}`,
		});
	} catch (error) {
		logger.error(
			{ err: error, response: error.response?.data },
			'Error sending WhatsApp message from gRPC',
		);
		callback(null, {
			success: false,
			message: 'Failed to send message to WhatsApp',
		});
	}
}

module.exports = {
	sendHandler,
};
