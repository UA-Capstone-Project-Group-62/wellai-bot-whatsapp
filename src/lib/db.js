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

	const users = [
		{ phoneNumber: '61434797285', termsAccepted: true },
		{ phoneNumber: '60123456789', termsAccepted: false },
		{ phoneNumber: '65987654321', termsAccepted: true },
		{ phoneNumber: '447700900123', termsAccepted: false },
		{ phoneNumber: '918888777666', termsAccepted: true },
	];

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

// Map raw message documents to the bot.proto Message shape.
// Bot-authored messages are flagged with is_bot rather than overloading user_id,
// so the user_id always reflects the real conversation participant.
function mapMessages(documents, phoneNumber) {
	return documents.map((msg) => ({
		user_id: phoneNumber,
		content: msg.content,
		is_bot: Boolean(msg.fromBot),
	}));
}

async function getMessages(phoneNumber, count) {
	const collection = await getCollection('messages');
	const documents = await collection
		.find({ phoneNumber })
		.sort({ timestamp: -1 })
		.limit(count)
		.toArray();
	return mapMessages(documents, phoneNumber);
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
	mapMessages,
	close,
};