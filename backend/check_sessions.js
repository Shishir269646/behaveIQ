require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('./src/models/Session');

const countSessions = async () => {
  try {
    const mongo_uri = process.env.MONGODB_URI || 'mongodb://admin:password123@mongodb:27017/behaveiq?authSource=admin';
    await mongoose.connect(mongo_uri.replace('@mongodb:', '@localhost:'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
    const count = await Session.countDocuments();
    console.log(`Number of sessions: ${count}`);
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

countSessions();