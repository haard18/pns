import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import logo from "../assets/Logo.png";
import { x, tg, discord } from "../assets/footer";
import { useDomain } from "../hooks/useDomain";
import { useAccount } from 'wagmi';
import { recordTransaction } from "../services/dbService";
// formatNumber not needed here

const RegisterDomain = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { register, getPrice } = useDomain();
    
    const [paymentMethod, setPaymentMethod] = useState<"USDC" | "Other">("USDC");
    const [discountCode, setDiscountCode] = useState("");
    const [years, setYears] = useState(1);
    const [selectedDomains, setSelectedDomains] = useState<{name: string; price: string; isChecked: boolean}[]>([]);
    const [registering, setRegistering] = useState(false);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmData, setConfirmData] = useState<{
        domains: { name: string; price: string }[];
        subtotal: number;
        rent: number;
        yearsCost: number;
        total: number;
    } | null>(null);

    // Get domain from URL params and load actual price
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const domain = params.get("domain");
        const urlPrice = params.get("price");
        
        if (domain && selectedDomains.length === 0) {
            const cleanDomain = domain.replace(/\.poly$/i, '');
            
            // If price is provided in URL, use it
            if (urlPrice) {
                setSelectedDomains([
                    { name: domain, price: urlPrice, isChecked: true }
                ]);
            } else {
                // Otherwise fetch it from contract
                setLoadingPrice(true);
                getPrice(cleanDomain).then((priceData) => {
                    setSelectedDomains([
                        { name: domain, price: priceData?.price || "0", isChecked: true }
                    ]);
                    setLoadingPrice(false);
                }).catch((err) => {
                    console.error('Error fetching price:', err);
                    setSelectedDomains([
                        { name: domain, price: "0", isChecked: true }
                    ]);
                    setLoadingPrice(false);
                });
            }
        }
    }, [getPrice]);

    // Calculate totals - in USDC
    const subtotal = selectedDomains
        .filter(d => d.isChecked)
        .reduce((sum, d) => sum + parseFloat(d.price || "0"), 0);
    const total = subtotal * years; // Price per year × years

    const usdValue = total.toFixed(2); // USDC is already USD

    const toggleDomain = (index: number) => {
        const updated = [...selectedDomains];
        updated[index].isChecked = !updated[index].isChecked;
        setSelectedDomains(updated);
    };

    

    // Prepare confirmation by fetching fresh oracle prices and showing a confirmation UI
    const prepareConfirmation = async () => {
        if (!isConnected) {
            alert('Please connect your wallet to pay on Polygon');
            return;
        }

        const items = selectedDomains.filter(d => d.isChecked);
        if (items.length === 0) {
            alert('Please select at least one domain');
            return;
        }

        setLoadingPrice(true);
        try {
            const resolved = await Promise.all(items.map(async (d) => {
                const clean = d.name.replace(/\.poly$/i, '');
                const priceData = await getPrice(clean, years);
                console.log('Oracle price for', clean, priceData);
                return {
                    name: d.name,
                    price: priceData?.price ?? '0'
                };
            }));

            const subtotalCalc = resolved.reduce((s, r) => s + parseFloat(r.price || '0'), 0);
            const rentCalc = 0; // No rent with USDC
            const yearsCost = 0; // Years cost included in price
            const totalCalc = subtotalCalc * years; // Price per year × years

            setConfirmData({ domains: resolved, subtotal: subtotalCalc, rent: rentCalc, yearsCost, total: totalCalc });
            setConfirming(true);
        } catch (err) {
            console.error('Failed to prepare confirmation:', err);
            alert('Failed to fetch latest prices. Try again.');
        } finally {
            setLoadingPrice(false);
        }
    };

    const handleConfirmAndPay = async () => {
        if (!isConnected) {
            alert('Please connect your wallet to pay on Polygon');
            return;
        }

        if (!confirmData) return;

        setRegistering(true);
        try {
            for (const domain of confirmData.domains) {
                const cleanDomain = domain.name.replace(/\.poly$/i, '');
                console.log('[RegisterDomain] calling register for', cleanDomain, 'expected price:', domain.price, 'years:', years);
                const result = await register(cleanDomain, address!, years);
                console.log('[RegisterDomain] register result for', cleanDomain, result);

                if (result && result.success && result.txHash) {
                    await recordTransaction({
                        txHash: result.txHash,
                        type: 'register',
                        domainName: cleanDomain,
                        owner: address!,
                        chainId: 137,
                        timestamp: Date.now(),
                        metadata: {
                            duration: years,
                            price: domain.price,
                        }
                    });
                }
            }

            alert('Transaction submitted. Check your wallet / explorer for confirmation.');
            setConfirming(false);
            setTimeout(() => navigate('/profile'), 1500);
        } catch (err) {
            console.error('Registration failed:', err);
            alert(`Registration failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden" style={{ background: "var(--primary-gradient)" }}>
            <Navbar />



            <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-12">
                {/* Header */}
                <motion.div
                    className="flex items-center gap-3 mb-6 md:mb-8"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <button
                        onClick={() => window.history.back()}
                        className="text-white hover:text-[#2349E2] transition"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl md:text-2xl text-white font-semibold">Register Domain</h1>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {/* LEFT PANEL - Payment & Order Details */}
                    <motion.div
                        className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-6 md:p-8 rounded-lg self-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Pay with Section */}
                        <div className="mb-6 md:mb-8">
                            <h3 className="text-white text-sm mb-4 flex items-center gap-2">
                                <span className="text-[#2349E2]">💳</span> Pay with
                            </h3>

                            <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setPaymentMethod("USDC")}
                                    className={`px-4 md:px-6 py-2 border ${paymentMethod === "USDC"
                                        ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                                        : "border-white/20 text-white/60"
                                        } rounded flex items-center gap-2 whitespace-nowrap text-sm md:text-base`}
                                >
                                    <span className="text-blue-400">$</span> USDC
                                </button>

                                <button
                                    onClick={() => setPaymentMethod("Other")}
                                    className={`px-4 md:px-6 py-2 border ${paymentMethod === "Other"
                                        ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                                        : "border-white/20 text-white/60"
                                        } rounded flex items-center gap-2 whitespace-nowrap text-sm md:text-base`}
                                    disabled
                                >
                                    Other Tokens (Coming Soon)
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
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <input
                                                type="checkbox"
                                                checked={domain.isChecked}
                                                onChange={() => toggleDomain(idx)}
                                                className="w-4 h-4 accent-[#2349E2] flex-shrink-0"
                                            />
                                            <span className="text-white text-sm truncate">{domain.name}</span>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-white text-sm">{parseFloat(domain.price).toFixed(2)} USDC</p>
                                            <p className="text-white/40 text-xs">~${parseFloat(domain.price).toFixed(2)} USD</p>
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
                            <div className="flex gap-3 flex-col sm:flex-row">
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
                                <span className="text-white/60 text-sm md:text-base">Price per year</span>
                                <div className="text-right">
                                    <p className="text-white text-sm md:text-base">{subtotal.toFixed(2)} USDC</p>
                                    <p className="text-white/40 text-xs">~${subtotal.toFixed(2)} USD</p>
                                </div>
                            </div>

                            {/* Years Selector */}
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-white/60 text-sm md:text-base">Years</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setYears(Math.max(1, years - 1))}
                                        className="w-8 h-8 bg-[#2349E2] text-white rounded flex items-center justify-center hover:bg-[#2349E2]/80"
                                    >
                                        −
                                    </button>
                                    <span className="text-white w-8 text-center">{years}</span>
                                    <button
                                        onClick={() => setYears(Math.min(10, years + 1))}
                                        className="w-8 h-8 bg-[#2349E2] text-white rounded flex items-center justify-center hover:bg-[#2349E2]/80"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-center pt-4 border-t border-white/10 mb-6">
                                <span className="text-white font-semibold text-lg">Total</span>
                                <div className="text-right">
                                    <p className="text-white font-semibold text-lg">{total.toFixed(2)} USDC</p>
                                    <p className="text-white/40 text-xs">~${usdValue} USD</p>
                                </div>
                            </div>

                            {/* Prepare / Confirm Button */}
                            <button
                                onClick={prepareConfirmation}
                                disabled={registering || !address || loadingPrice}
                                className="w-full bg-[#2349E2] hover:bg-[#2349E2]/80 disabled:opacity-50 text-white font-medium py-3 rounded transition"
                            >
                                {loadingPrice ? 'Fetching prices...' : registering ? 'Registering...' : !address ? 'Connect Wallet' : 'Review & Confirm'}
                            </button>

                            {/* Confirmation panel (shown after preparing) */}
                            {confirming && confirmData && (
                                <div className="mt-4 p-4 bg-white/5 border border-[#2349E2]/30 rounded">
                                    <p className="text-white text-sm mb-3">Please confirm the following charges (will prompt your wallet for USDC approval):</p>
                                    <div className="space-y-2 mb-3">
                                        {confirmData.domains.map((d, i) => (
                                            <div key={i} className="flex justify-between text-white text-sm">
                                                <span className="truncate pr-4">{d.name}</span>
                                                <span className="whitespace-nowrap">{parseFloat(d.price).toFixed(2)} USDC</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between text-white/80 text-sm mb-2">
                                        <span>Price per year</span>
                                        <span>{confirmData.subtotal.toFixed(2)} USDC</span>
                                    </div>
                                    <div className="flex justify-between text-white/80 text-sm mb-4">
                                        <span>Duration</span>
                                        <span>{years} year{years > 1 ? 's' : ''}</span>
                                    </div>

                                    <div className="flex justify-between items-center mb-3">
                                        <strong className="text-white">Total</strong>
                                        <strong className="text-white">{confirmData.total.toFixed(2)} USDC</strong>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={() => { setConfirming(false); setConfirmData(null); }} className="flex-1 px-4 py-2 border text-white border-white/20 rounded">Cancel</button>
                                        <button onClick={handleConfirmAndPay} disabled={registering} className="flex-1 px-4 py-2 bg-[#2349E2] text-white rounded">{registering ? 'Processing...' : 'Confirm & Pay'}</button>
                                    </div>
                                </div>
                            )}
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
                                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mt-4 pt-4">
                                    <div>
                                        <p className="text-white text-xs md:text-sm font-medium">1-YEAR</p>
                                        <p className="text-white/60 text-[10px] md:text-xs mt-1">9% gas</p>
                                    </div>

                                    <div>
                                        <p className="text-white text-xs md:text-sm font-medium">2-YEAR</p>
                                        <p className="text-white/60 text-[10px] md:text-xs mt-1">5% gas</p>
                                    </div>

                                    <div>
                                        <p className="text-white text-xs md:text-sm font-medium">5-YEAR</p>
                                        <p className="text-white/60 text-[10px] md:text-xs mt-1">2% gas</p>
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
