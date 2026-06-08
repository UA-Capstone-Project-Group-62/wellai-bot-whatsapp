const { MongoClient } = require('mongodb');
const { env } = require('./env');
const { logger } = require('./logger');

let client;
let db;

async function connect() {
	if (db) return db;

	client = new MongoClient(env.mongoUri);
	await client.connect();
	db = client.db(env.mongoDbName);
	logger.info({ db: env.mongoDbName }, 'Connected to MongoDB');
	return db;
}

async function getCollection(name) {
	const database = await connect();
	return database.collection(name);
}

async function seedUsers() {
	const collection = await getCollection('users');

	const existingCount = await collection.countDocuments();
	if (existingCount > 0) {
		logger.info({ count: existingCount }, 'Users collection already seeded');
		return;
	}

	const users = [];

	if (users.length === 0) {
		logger.info('No users to seed');
		return;
	}

	await collection.insertMany(users);
	logger.info({ count: users.length }, 'Seeded users collection');
}

async function addUserIfNotExists(phoneNumber) {
	const collection = await getCollection('users');
	const existing = await collection.findOne({ phoneNumber });

	if (!existing) {
		await collection.insertOne({ phoneNumber, termsAccepted: false });
		logger.info({ phoneNumber }, 'New user added to database');
		return false;
	}
	return existing.termsAccepted;
}

async function getUser(phoneNumber) {
	const collection = await getCollection('users');
	return collection.findOne({ phoneNumber });
}

async function setTermsAccepted(phoneNumber, accepted = true) {
	const collection = await getCollection('users');
	const result = await collection.updateOne(
		{ phoneNumber },
		{ $set: { termsAccepted: accepted } },
	);
	logger.info({ phoneNumber, termsAccepted: accepted }, 'Updated termsAccepted status');
	return result.modifiedCount > 0;
}

async function storeConversationId(phoneNumber, conversationId) {
	const collection = await getCollection('users');
	await collection.updateOne(
		{ phoneNumber },
		{ $set: { conversationId } },
	);
	logger.info({ phoneNumber, conversationId }, 'Stored conversation ID');
}

async function getConversationId(phoneNumber) {
	const collection = await getCollection('users');
	const user = await collection.findOne({ phoneNumber });
	return user?.conversationId;
}

async function storeMessage(phoneNumber, content, fromBot = false) {
	const collection = await getCollection('messages');
	await collection.insertOne({
		phoneNumber,
		content,
		fromBot,
		timestamp: new Date(),
	});
	logger.debug({ phoneNumber, fromBot }, 'Message stored');
}

async function getMessages(phoneNumber, count) {
	const collection = await getCollection('messages');
	const messages = await collection
		.find({ phoneNumber })
		.sort({ timestamp: -1 })
		.limit(count)
		.toArray();
	return messages.map((msg) => ({
		user_id: msg.fromBot ? 'bot' : phoneNumber,
		content: msg.content,
	}));
}

async function close() {
	if (client) {
		await client.close();
		db = null;
		client = null;
		logger.info('MongoDB connection closed');
	}
}

module.exports = {
	connect,
	getCollection,
	seedUsers,
	addUserIfNotExists,
	getUser,
	setTermsAccepted,
	storeConversationId,
	getConversationId,
	storeMessage,
	getMessages,
	close,
};
