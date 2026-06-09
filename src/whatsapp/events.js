const fs = require('fs');
const path = require('path');
const { logger } = require('../lib/logger');
const { sendAgentMessage } = require('../grpc/agent-client');
const {
	addUserIfNotExists,
	setTermsAccepted,
	setPreferredLanguage,
	getPreferredLanguage,
	storeMessage,
} = require('../lib/db');
const {
	sendWhatsappTextMessage,
	sendWhatsappInteractiveMessage,
} = require('./apis');

const LANGUAGE_MAP = {
	lang_en: 'english',
	lang_zh: 'mandarin',
	lang_ms: 'malay',
};

const TERMS_FILES = {
	english: 'terms-conditions.txt',
	mandarin: 'terms-conditions-mandarin.txt',
	malay: 'terms-conditions-malay.txt',
};

const LANGUAGE_BUTTONS = [
	{ id: 'lang_en', title: 'English' },
	{ id: 'lang_zh', title: '中文' },
	{ id: 'lang_ms', title: 'Bahasa Melayu' },
];

function loadTermsForLanguage(language) {
	const fileName = TERMS_FILES[language] || TERMS_FILES.english;
	const filePath = path.resolve(__dirname, '..', '..', fileName);
	return fs.readFileSync(filePath, 'utf8');
}

async function sendLanguageSelection(phoneNumber) {
	const bodyText = [
		'👋 Welcome to Smart Health Connect',
		'',
		'Please select your preferred language to continue.',
		'',
		'请选择您的首选语言以继续。',
		'',
		'Sila pilih bahasa pilihan anda untuk meneruskan.',
	].join('\n');

	await sendWhatsappInteractiveMessage({
		to: phoneNumber,
		bodyText,
		buttons: LANGUAGE_BUTTONS,
	});
}

async function processIncomingWhatsappMessage({
	from,
	text,
	interactive,
	rawMessage,
}) {
	logger.info(
		{ from, text: text || '', interactive, messageId: rawMessage?.id || '' },
		'Inbound WhatsApp message received for processing',
	);

	if (!from) {
		logger.warn(
			{ from, messageId: rawMessage?.id || '' },
			'Skipping message due to missing from field',
		);
		return;
	}

	const preferredLanguage = await getPreferredLanguage(from);

	if (!preferredLanguage) {
		if (interactive?.type === 'button_reply') {
			const buttonId = interactive.button_reply.id;
			const selectedLanguage = LANGUAGE_MAP[buttonId];

			if (selectedLanguage) {
				await setPreferredLanguage(from, selectedLanguage);
				await setTermsAccepted(from, true);

				const termsText = loadTermsForLanguage(selectedLanguage);
				await sendWhatsappTextMessage({ to: from, text: termsText });
				await storeMessage(from, termsText, true);

				logger.info(
					{ from, language: selectedLanguage },
					'Language selected and terms & conditions sent',
				);
			} else {
				logger.warn({ from, buttonId }, 'Unknown language button ID');
			}
			return;
		}

		await addUserIfNotExists(from);
		await sendLanguageSelection(from);
		logger.info({ from }, 'Language selection prompt sent');
		return;
	}

	logger.info(
		{ from, preferredLanguage },
		'User has saved language preference, skipping language selection',
	);

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
