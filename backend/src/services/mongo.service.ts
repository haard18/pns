import mongoose from 'mongoose';
import logger from '../utils/logger';

class MongoService {
    private static instance: MongoService;
    private isConnected: boolean = false;

    private constructor() { }

    public static getInstance(): MongoService {
        if (!MongoService.instance) {
            MongoService.instance = new MongoService();
        }
        return MongoService.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/pns-waitlist';

            await mongoose.connect(mongoUrl);

            this.isConnected = true;
            logger.info('Connected to MongoDB');

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('Disconnected from MongoDB');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
}

export default MongoService.getInstance();
