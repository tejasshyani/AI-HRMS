const mongoose = require('mongoose');

let isConnected = false;
let useMemoryStore = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.log('[HRMS Data Engine] No MONGODB_URI specified. Operating with In-Memory / Local HRMS Engine.');
    useMemoryStore = true;
    isConnected = true;
    return null;
  }

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
    console.warn(`[MongoDB Warning] Live MongoDB connection failed (${error.message}).`);
    console.log(`[HRMS Data Engine] Operating in In-Memory / Local HRMS Mode.`);
    useMemoryStore = true;
    isConnected = true;
    return null;
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
