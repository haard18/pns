import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import logo from "../assets/Logo.png";
import { x, tg, discord } from "../assets/footer";

const RegisterDomain = () => {
    const [paymentMethod, setPaymentMethod] = useState<"SOL" | "USDC" | "Other">("SOL");
    const [discountCode, setDiscountCode] = useState("");
    const [years, setYears] = useState(2);
    const [selectedDomains, setSelectedDomains] = useState([
        { name: "alex.poly", price: 0.1446, isChecked: true },
        { name: "dylan.poly", price: 0.1453, isChecked: false }
    ]);

    // Calculate totals
    const subtotal = selectedDomains
        .filter(d => d.isChecked)
        .reduce((sum, d) => sum + d.price, 0);
    const rent = 0.0032;
    const total = subtotal + rent + (years * 0.005);

    const usdValue = (total * 20).toFixed(2); // Assuming 1 SOL = ~$20 for demo

    const toggleDomain = (index: number) => {
        const updated = [...selectedDomains];
        updated[index].isChecked = !updated[index].isChecked;
        setSelectedDomains(updated);
    };

    return (
        <div className="min-h-screen overflow-hidden" style={{ background: "var(--primary-gradient)" }}>
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                {/* Header */}
                <motion.div
                    className="flex items-center gap-3 mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <button
                        onClick={() => window.history.back()}
                        className="text-white hover:text-[#2349E2] transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-2xl text-white font-semibold">Register Domain</h1>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT PANEL - Payment & Order Details */}
                    <motion.div
                        className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-8 rounded-lg self-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Pay with Section */}
                        <div className="mb-8">
                            <h3 className="text-white text-sm mb-4 flex items-center gap-2">
                                <span className="text-[#2349E2]">💳</span> Pay with
                            </h3>

                            <div className="flex gap-3 mb-4">
                                <button
                                    onClick={() => setPaymentMethod("SOL")}
                                    className={`px-6 py-2 border ${paymentMethod === "SOL"
                                        ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                                        : "border-white/20 text-white/60"
                                        } rounded flex items-center gap-2`}
                                >
                                    <span className="text-purple-400">◎</span> SOL
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("USDC")}
                                    className={`px-6 py-2 border ${paymentMethod === "USDC"
                                        ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                                        : "border-white/20 text-white/60"
                                        } rounded`}
                                >
                                    <span className="text-blue-400">◎</span> USDC
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("Other")}
                                    className={`px-6 py-2 border ${paymentMethod === "Other"
                                        ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                                        : "border-white/20 text-white/60"
                                        } rounded flex items-center gap-2`}
                                >
                                    Other Tokens
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24  24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="mb-6">
                            <h3 className="text-white text-sm mb-4 flex items-center gap-2">
                                <span className="text-[#2349E2]">ℹ️</span> Order Details
                            </h3>

                            <div className="border border-[#2349E2]/30 rounded">
                                {/* Header Row */}
                                <div className="grid grid-cols-3 gap-4 px-4 py-3 border-b border-[#2349E2]/30 text-white/60 text-xs">
                                    <span>Domain</span>
                                    <span className="text-right">Fees</span>
                                    <span className="text-right">Primary</span>
                                </div>

                                {/* Domain Rows */}
                                {selectedDomains.map((domain, idx) => (
                                    <div
                                        key={idx}
                                        className="grid grid-cols-3 gap-4 px-4 py-4 border-b border-[#2349E2]/30 items-center hover:bg-white/5"
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={domain.isChecked}
                                                onChange={() => toggleDomain(idx)}
                                                className="w-4 h-4 accent-[#2349E2]"
                                            />
                                            <span className="text-white text-sm">{domain.name}</span>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-white text-sm">{domain.price.toFixed(4)} SOL</p>
                                            <p className="text-white/40 text-xs">~${(domain.price * 20).toFixed(2)} USDC</p>
                                        </div>

                                        <div className="flex justify-end">
                                            <input
                                                type="checkbox"
                                                checked={domain.isChecked}
                                                onChange={() => toggleDomain(idx)}
                                                className="w-4 h-4 accent-[#2349E2]"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT PANEL - Discount & Summary */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* Discount Code */}
                        <div className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-6 rounded-lg">
                            <h3 className="text-white text-sm mb-4">Have a discount code?</h3>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="Enter your referral domain"
                                    className="flex-1 bg-transparent border border-white/20 rounded px-4 py-2 text-white placeholder-white/40 focus:border-[#2349E2] outline-none"
                                />
                                <button className="px-6 py-2 bg-[#2349E2] text-white rounded hover:bg-[#2349E2]/80 transition">
                                    Apply
                                </button>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-6 rounded-lg">
                            <h3 className="text-white text-sm mb-6 flex items-center gap-2">
                                <span className="text-[#2349E2]">ℹ️</span> Order Summary
                            </h3>

                            {/* Subtotal */}
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                                <span className="text-white/60">Subtotal</span>
                                <div className="text-right">
                                    <p className="text-white">{subtotal.toFixed(4)} SOL</p>
                                    <p className="text-white/40 text-xs">~${(subtotal * 20).toFixed(2)} USDC</p>
                                </div>
                            </div>

                            {/* Rent */}
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-white/60">Rent</span>
                                <p className="text-white">{rent.toFixed(4)} SOL</p>
                            </div>

                            {/* Years Selector */}
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-white/60">Years</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setYears(Math.max(1, years - 1))}
                                        className="w-8 h-8 bg-[#2349E2] text-white rounded flex items-center justify-center hover:bg-[#2349E2]/80"
                                    >
                                        −
                                    </button>
                                    <span className="text-white w-8 text-center">{years}</span>
                                    <button
                                        onClick={() => setYears(Math.min(5, years + 1))}
                                        className="w-8 h-8 bg-[#2349E2] text-white rounded flex items-center justify-center hover:bg-[#2349E2]/80"
                                    >
                                        +
                                    </button>
                                    <span className="text-white ml-2">{(years * 0.005).toFixed(4)} SOL</span>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-4 border-t border-white/10 mb-6">
                                <span className="text-white font-semibold">Total</span>
                                <div className="text-right">
                                    <p className="text-white font-semibold">{total.toFixed(4)} SOL</p>
                                    <p className="text-white/40 text-xs">~${usdValue} USDC</p>
                                </div>
                            </div>

                            {/* Confirm Button */}
                            <button className="w-full bg-[#2349E2] hover:bg-[#2349E2]/80 text-white font-medium py-3 rounded transition">
                                Confirm
                            </button>
                        </div>

                        {/* Info Section */}
                        <motion.div
                            className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-6 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-start gap-3 mb-6">
                                <span className="text-[#2349E2] text-xl">ℹ️</span>
                                <p className="text-white/60 text-sm">
                                    Extending for multiple years will save money on network cost by avoiding yearly transactions.
                                </p>
                            </div>

                            {/* Pricing Tiers */}
                            <div className="relative">
                                {/* Background bar with gradient */}
                                <div className="h-3 w-full flex mb-8">
                                    <div className="bg-blue-700 w-[70%]"></div>
                                    <div className="bg-green-500 w-[30%]"></div>
                                </div>
                                {/* <div className="h-3 bg-leaner from-blue-700 from-0% via-[#2349E2] via-70% to-green-500 to-100% mb-8"></div> */}

                                {/* Dots on the bar */}
                                <div className="absolute top-[12px] left-0 right-0 flex justify-between px-1">
                                    {/* 1-YEAR dot */}
                                    <div className="relative" style={{ left: '13%' }}>
                                        <div className="w-px h-6 bg-white "></div>
                                        <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                                    </div>

                                    {/* 2-YEAR dot */}
                                    <div className="relative" style={{ left: '0%' }}>
                                        <div className="w-px h-6 bg-white "></div>
                                        <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                                    </div>

                                    {/* 5-YEAR dot */}
                                    <div className="relative" style={{ left: '-15%' }}>
                                        <div className="w-px h-6 bg-white "></div>
                                        <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4">
                                    <div>
                                        <p className="text-white text-sm font-medium">1-YEAR</p>
                                        <p className="text-white/60 text-xs mt-1">9% gas</p>
                                    </div>

                                    <div>
                                        <p className="text-white text-sm font-medium">2-YEAR</p>
                                        <p className="text-white/60 text-xs mt-1">5% gas</p>
                                    </div>

                                    <div>
                                        <p className="text-white text-sm font-medium">5-YEAR</p>
                                        <p className="text-white/60 text-xs mt-1">2% gas</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-[#020215] py-16 px-10 mt-20">
                <motion.div
                    className="w-full mx-16 grid grid-cols-1 md:grid-cols-2 gap-16"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    {/* LEFT SIDE - LOGO + SOCIALS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.img
                            src={logo}
                            alt="Main Logo"
                            className="my-3"
                            whileHover={{ scale: 1.05 }}
                        />

                        <div className="flex items-center gap-4 mt-4">
                            <motion.button
                                className="flex items-center justify-center hover:bg-white/10 transition"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <img src={discord} alt="Discord" />
                            </motion.button>
                            <motion.button
                                className="flex items-center justify-center hover:bg-white/10 transition"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <img src={x} alt="Twitter" />
                            </motion.button>
                            <motion.button
                                className="flex items-center justify-center hover:bg-white/10 transition"
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <img src={tg} alt="Telegram" />
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* RIGHT SIDE - LINKS */}
                    <motion.div
                        className="grid grid-cols-2 sm:grid-cols-3 gap-10"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <div>
                            <h4 className="text-white font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-white/60 text-sm">
                                <li><a href="#" className="hover:text-white transition">Features</a></li>
                                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-white/60 text-sm">
                                <li><a href="#" className="hover:text-white transition">About</a></li>
                                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-semibold mb-4">Resources</h4>
                            <ul className="space-y-2 text-white/60 text-sm">
                                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition">Support</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                            </ul>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Copyright */}
                <div className="text-center mt-12 pt-8 border-t border-white/10">
                    <p className="text-white/40 text-sm">© 2025 PNS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default RegisterDomain;
