const { MongoClient } = require('mongodb');
const { env } = require('./env');
const { logger } = require('./logger');

let client;
let db;

/**
 * Connect to MongoDB (singleton)
 */
async function connect() {
    if (db) return db;

    try {
        client = new MongoClient(env.mongoUri, {
            maxPoolSize: 10,
            connectTimeoutMS: 5000,
        });

        await client.connect();
        db = client.db(env.mongoDbName);

        logger.info({ db: env.mongoDbName }, 'Connected to MongoDB');
        return db;
    } catch (err) {
        logger.error({ err }, 'Failed to connect to MongoDB');
        throw err;
    }
}

/**
 * Get a MongoDB collection
 */
async function getCollection(name) {
    const database = await connect();
    return database.collection(name);
}

/**
 * Seed initial users
 */
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

/**
 * Add user if not exists
 */
async function addUserIfNotExists(phoneNumber) {
    const collection = await getCollection('users');
    const existing = await collection.findOne({ phoneNumber });

    if (!existing) {
        await collection.insertOne({
            phoneNumber,
            termsAccepted: false,
            createdAt: new Date(),
        });
        logger.info({ phoneNumber }, 'New user added to database');
        return false;
    }

    return existing.termsAccepted;
}

/**
 * Get user by phone number
 */
async function getUser(phoneNumber) {
    const collection = await getCollection('users');
    return collection.findOne({ phoneNumber });
}

/**
 * Update terms acceptance
 */
async function setTermsAccepted(phoneNumber, accepted = true) {
    const collection = await getCollection('users');
    const result = await collection.updateOne(
        { phoneNumber },
        { $set: { termsAccepted: accepted, updatedAt: new Date() } },
    );

    logger.info({ phoneNumber, termsAccepted: accepted }, 'Updated termsAccepted status');
    return result.modifiedCount > 0;
}

/**
 * Store conversation ID for user
 */
async function storeConversationId(phoneNumber, conversationId) {
    const collection = await getCollection('users');
    await collection.updateOne(
        { phoneNumber },
        { $set: { conversationId, updatedAt: new Date() } },
    );

    logger.info({ phoneNumber, conversationId }, 'Stored conversation ID');
}

/**
 * Get conversation ID for user
 */
async function getConversationId(phoneNumber) {
    const collection = await getCollection('users');
    const user = await collection.findOne({ phoneNumber });
    return user?.conversationId;
}

/**
 * Store a message (user or bot)
 */
async function storeMessage(phoneNumber, content, fromBot = false) {
    const collection = await getCollection('messages');

    const message = {
        phoneNumber,
        content,
        fromBot,
        timestamp: new Date(),
    };

    await collection.insertOne(message);

    logger.debug(
        { phoneNumber, fromBot, content },
        'Message stored in database'
    );
}

/**
 * Get last N messages for a user
 */
async function getMessages(phoneNumber, count = 10) {
    const collection = await getCollection('messages');

    const messages = await collection
        .find({ phoneNumber })
        .sort({ timestamp: -1 })
        .limit(count)
        .toArray();

    return messages.map((msg) => ({
        user_id: msg.fromBot ? 'bot' : phoneNumber,
        content: msg.content,
        timestamp: msg.timestamp,
    }));
}

/**
 * Close MongoDB connection
 */
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
