import { Request, Response } from 'express';
import Waitlist from '../models/Waitlist';
import logger from '../utils/logger';

export const joinWaitlist = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Check if email already exists
        const existing = await Waitlist.findOne({ email });
        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Email already registered'
            });
        }

        const ipAddress = req.ip || req.socket.remoteAddress;

        const newEntry = new Waitlist({
            email,
            ipAddress
        });

        await newEntry.save();

        logger.info(`New waitlist entry: ${email}`);

        return res.status(201).json({
            success: true,
            message: 'Successfully joined waitlist'
        });

    } catch (error) {
        logger.error('Error joining waitlist:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
