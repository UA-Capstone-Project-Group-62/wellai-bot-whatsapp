require('dotenv').config();

const env = {
	grpcPort: Number(process.env.GRPC_PORT || 50051),
	agentServiceAddr: process.env.AGENT_SERVICE_ADDR || 'localhost:50052',
	whatsappPort: Number(process.env.WHATSAPP_PORT || 5000),
	whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
	whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN,
	whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
	nodeEnv: process.env.NODE_ENV || 'development',
	logLevel: process.env.LOG_LEVEL || 'info',
	logPretty: process.env.LOG_PRETTY,
};

module.exports = {
	env,
};
