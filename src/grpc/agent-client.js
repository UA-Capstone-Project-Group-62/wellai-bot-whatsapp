const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { env } = require('../lib/env');

const PROTO_ROOT = path.resolve(__dirname, '..', '..', 'proto');
const AGENT_PROTO_PATH = path.join(PROTO_ROOT, 'proto', 'agent', 'agent.proto');

function loadAgentService() {
	const packageDefinition = protoLoader.loadSync(AGENT_PROTO_PATH, {
		keepCase: true,
		longs: String,
		enums: String,
		defaults: true,
		oneofs: true,
		includeDirs: [PROTO_ROOT],
	});

	const loadedProto = grpc.loadPackageDefinition(packageDefinition);
	const agentProto = loadedProto.wellai_bot?.agent;

	if (!agentProto?.AgentService) {
		throw new Error(
			'Failed to load wellai_bot.agent.AgentService from agent.proto',
		);
	}

	return agentProto.AgentService;
}

const AgentService = loadAgentService();
const agentClient = new AgentService(
	env.agentServiceAddr,
	grpc.credentials.createInsecure(),
);

function sendAgentMessage({ user_id, content }) {
	return new Promise((resolve, reject) => {
		agentClient.receive({ user_id, content }, (error, response) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(response);
		});
	});
}

module.exports = {
	sendAgentMessage,
};
