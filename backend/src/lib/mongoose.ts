import mongoose from 'mongoose';
import { config } from '../config';
import type { ConnectOptions } from 'mongoose'; 

const clientOptions: ConnectOptions = {
    dbName: 'concert_booking', 
    appName: 'Concert Booking API', 
    serverApi: {
        version: '1', 
        strict: true, 
        deprecationErrors: true, 
    }
};

export const connectToDatabase = async (): Promise<void> => {
    if (!config.mongodb.uri) {
        throw new Error('MongoDB URI is not defined in the configuration')
    }
    try {
        await mongoose.connect(config.mongodb.uri, clientOptions);
        console.log("Connected to MongoDB successfully", {
            uri: config.mongodb.uri, 
            options: clientOptions, 
        })
    } catch (err) {
        if (err instanceof Error) {
            throw err;
        }
        console.log('Error connecting to MongoDB', err);  
    }
}

export const disconnectFromDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB successfully', {
            uri: config.mongodb.uri, 
            options: clientOptions
        }); 
    } catch (err) {
        if (err instanceof Error) {
            throw new Error(err.message); 
        }

        console.log('Error disconnecting from MongoDB', err); 
    }
}