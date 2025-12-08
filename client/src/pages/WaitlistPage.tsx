import { motion, type Variants } from "framer-motion";
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "../App.css";
import bars from "../assets/bars.png";

// Animation variants
const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    },
};

const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const scaleIn: Variants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    },
};

const WaitlistPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || !email.includes('@')) {
            setMessage("Please enter a valid email address.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            const response = await fetch(`${apiUrl}/waitlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage("You're on the list! We'll be in touch soon.");
                setEmail('');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Something went wrong.');
            }
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || "Failed to join waitlist. Please try again.");
        }
    };

    return (
        <div
            className="relative min-h-screen overflow-hidden"
            style={{ background: "var(--primary-gradient)" }}
        >
            <Navbar />

            <motion.div
                className="flex flex-col items-center text-center mt-32 md:mt-40 lg:mt-48 px-4 pb-20 md:pb-40"
                initial="initial"
                animate="animate"
                variants={staggerContainer}
            >
                <motion.h1
                    className="text-3xl md:text-3xl lg:text-4xl text-[var(--text-light)] max-w-4xl leading-tight"
                    variants={fadeInUp}
                >
                    Predictify - The Future of Naming
                </motion.h1>

                <motion.p
                    className="text-base text-sm md:text-lg text-[var(--text-soft)] mt-4 max-w-3xl"
                    variants={fadeInUp}
                >
                    We are currently preparing for launch. Secure your spot in line and get exclusive updates for the .poly name service.
                </motion.p>

                {/* Waitlist Form */}
                <motion.div
                    className="mt-8 w-full max-w-xl flex items-center bg-black backdrop-blur-md border border-white/20 overflow-hidden rounded-none"
                    variants={scaleIn}
                >
                    {status === 'success' ? (
                        <div className="w-full px-4 py-3 text-white text-center">
                            <span className="text-green-400 mr-2">✓</span>
                            {message}
                        </div>
                    ) : (
                        <>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                placeholder="Enter your email address"
                                className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white placeholder-opacity-100 outline-none min-w-0"
                                disabled={status === 'loading'}
                            />

                            <div className="relative inline-block m-4">
                                {/* Glow */}
                                <div
                                    className="absolute inset-0 blur-xl opacity-20"
                                    style={{
                                        background: 'radial-gradient(circle, #2349E2 0%, transparent 70%)',
                                    }}
                                ></div>

                                <motion.button
                                    onClick={() => handleSubmit()}
                                    className="relative px-6 py-3 border border-[#2349E2] transition text-white font-medium disabled:opacity-50"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={status === 'loading'}
                                >
                                    {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
                                </motion.button>
                            </div>
                        </>
                    )}
                </motion.div>

                {status === 'error' && (
                    <motion.p
                        className="mt-4 text-red-400 text-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {message}
                    </motion.p>
                )}

            </motion.div>

            {/* Bars image at the bottom */}
            <img
                src={bars}
                alt="section divider"
                className="absolute bottom-0 left-0 w-full opacity-60 pointer-events-none select-none"
            />
        </div>
    );
};

export default WaitlistPage;
