import { MongoClient } from 'mongodb';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.connected = false;
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.client.connect()
      .then(() => {
        this.db = this.client.db(DB_DATABASE);
        this.connected = true;
      })
      .catch((err) => {
        console.error(`MongoDB connection error: ${err}`);
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
