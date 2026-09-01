const mongoose = require('mongoose');

let isConnected = false;
let useMemoryStore = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 
              process.env.MONGO_URI || 
              'mongodb+srv://tejasshyani_db_user:CXhdqpF0zUcLfIEo@aicloud-dev.ajbjj6m.mongodb.net/HRMS?retryWrites=true&w=majority&appName=AICloud-Dev';
  
  try {
    mongoose.set('strictQuery', false);
    console.log(`[MongoDB] Initiating connection to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    useMemoryStore = false;
    console.log(`[MongoDB Atlas] Connected successfully to: ${conn.connection.name} @ ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Error] MongoDB Atlas connection failed: ${error.message}`);
    throw error;
  }
};

const isLiveConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1 && !useMemoryStore;
};

const getDBStatus = () => ({
  isConnected,
  isLiveMongo: isLiveConnected(),
  mode: isLiveConnected() ? 'MongoDB Atlas / Live MongoDB' : 'In-Memory HRMS Engine',
  dbName: 'HRMS'
});

module.exports = {
  connectDB,
  getDBStatus,
  isLiveConnected,
  isUsingMemory: () => !isLiveConnected()
};
