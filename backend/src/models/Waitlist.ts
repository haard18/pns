import mongoose, { Schema, Document } from 'mongoose';

export interface IWaitlist extends Document {
    email: string;
    createdAt: Date;
    ipAddress?: string;
}

const WaitlistSchema: Schema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    ipAddress: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model<IWaitlist>('Waitlist', WaitlistSchema);
