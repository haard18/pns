import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import logo from "../assets/Logo.png";
import { x, tg, discord } from "../assets/footer";
import { useDomain } from "../hooks/useDomain";
import { useAccount } from "wagmi";
import { recordTransaction } from "../services/dbService";
import { DaimoPayButton } from "@daimo/pay";
import { useDaimoPayDomain } from "../hooks/useDaimoPayDomain";
// formatNumber not needed here

const RegisterDomain = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { register, getPrice } = useDomain();
  const { paymentState, prepareDaimoPayProps } = useDaimoPayDomain();

  const [paymentMethod, setPaymentMethod] = useState<
    "USDC" | "Daimo" | "Other"
  >("Daimo");
  const [discountCode, setDiscountCode] = useState("");
  const [years, setYears] = useState(1);
  const [selectedDomains, setSelectedDomains] = useState<
    { name: string; price: string; isChecked: boolean }[]
  >([]);
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
      const cleanDomain = domain.replace(/\.poly$/i, "");

      // If price is provided in URL, use it
      if (urlPrice) {
        setSelectedDomains([
          { name: domain, price: urlPrice, isChecked: true },
        ]);
      } else {
        // Otherwise fetch it from contract
        setLoadingPrice(true);
        getPrice(cleanDomain)
          .then((priceData) => {
            setSelectedDomains([
              { name: domain, price: priceData?.price || "0", isChecked: true },
            ]);
            setLoadingPrice(false);
          })
          .catch((err) => {
            console.error("Error fetching price:", err);
            setSelectedDomains([{ name: domain, price: "0", isChecked: true }]);
            setLoadingPrice(false);
          });
      }
    }
  }, [getPrice]);

  // Handle successful Daimo Pay registration
  useEffect(() => {
    if (paymentState.isComplete && paymentState.txHash) {
      const timer = setTimeout(() => {
        navigate("/profile");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [paymentState.isComplete, paymentState.txHash, navigate]);

  // Calculate totals - in USDC
  const subtotal = selectedDomains
    .filter((d) => d.isChecked)
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
      alert("Please connect your wallet to pay on Polygon");
      return;
    }

    const items = selectedDomains.filter((d) => d.isChecked);
    if (items.length === 0) {
      alert("Please select at least one domain");
      return;
    }

    setLoadingPrice(true);
    try {
      const resolved = await Promise.all(
        items.map(async (d) => {
          const clean = d.name.replace(/\.poly$/i, "");
          const priceData = await getPrice(clean, years);
          console.log("Oracle price for", clean, priceData);
          return {
            name: d.name,
            price: priceData?.price ?? "0",
          };
        })
      );

      const subtotalCalc = resolved.reduce(
        (s, r) => s + parseFloat(r.price || "0"),
        0
      );
      const rentCalc = 0; // No rent with USDC
      const yearsCost = 0; // Years cost included in price
      const totalCalc = subtotalCalc * years; // Price per year × years

      setConfirmData({
        domains: resolved,
        subtotal: subtotalCalc,
        rent: rentCalc,
        yearsCost,
        total: totalCalc,
      });
      setConfirming(true);
    } catch (err) {
      console.error("Failed to prepare confirmation:", err);
      alert("Failed to fetch latest prices. Try again.");
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!isConnected) {
      alert("Please connect your wallet to pay on Polygon");
      return;
    }

    if (!confirmData) return;

    setRegistering(true);
    try {
      for (const domain of confirmData.domains) {
        const cleanDomain = domain.name.replace(/\.poly$/i, "");
        console.log(
          "[RegisterDomain] calling register for",
          cleanDomain,
          "expected price:",
          domain.price,
          "years:",
          years
        );
        const result = await register(cleanDomain, address!, years);
        console.log(
          "[RegisterDomain] register result for",
          cleanDomain,
          result
        );

        if (result && result.success && result.txHash) {
          await recordTransaction({
            txHash: result.txHash,
            type: "register",
            domainName: cleanDomain,
            owner: address!,
            chainId: 137,
            timestamp: Date.now(),
            metadata: {
              duration: years,
              price: domain.price,
            },
          });
        }
      }

      alert(
        "Transaction submitted. Check your wallet / explorer for confirmation."
      );
      setConfirming(false);
      setTimeout(() => navigate("/profile"), 1500);
    } catch (err) {
      console.error("Registration failed:", err);
      alert(
        `Registration failed: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ background: "var(--primary-gradient)" }}
    >
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
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl md:text-2xl text-white font-semibold">
            Register Domain
          </h1>
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
                <svg
                  className="w-5 h-5 text-[#2349E2]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Pay with
              </h3>

              <div className="flex gap-3 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setPaymentMethod("Daimo")}
                  className={`px-4 md:px-6 py-2 border ${
                    paymentMethod === "Daimo"
                      ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                      : "border-white/20 text-white/60"
                  } rounded flex items-center gap-2 whitespace-nowrap text-sm md:text-base`}
                >
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Pay from Any Chain
                </button>

                <button
                  onClick={() => setPaymentMethod("USDC")}
                  className={`px-4 md:px-6 py-2 border ${
                    paymentMethod === "USDC"
                      ? "border-[#2349E2] bg-[#2349E2]/20 text-white"
                      : "border-white/20 text-white/60"
                  } rounded flex items-center gap-2 whitespace-nowrap text-sm md:text-base`}
                >
                  <span className="text-blue-400">$</span> USDC on Polygon
                </button>
              </div>

              {paymentMethod === "Daimo" && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded text-xs md:text-sm text-white/80 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    Pay with any token from any chain - ETH, USDC, USDT on
                    Ethereum, Base, Arbitrum, Optimism, and more!
                  </span>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="mb-6">
              <h3 className="text-white text-sm mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#2349E2]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Order Details
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
                        className="w-4 h-4 accent-[#2349E2] shrink-0"
                      />
                      <span className="text-white text-sm truncate">
                        {domain.name}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-white text-sm">
                        {parseFloat(domain.price).toFixed(2)} USDC
                      </p>
                      <p className="text-white/40 text-xs">
                        ~${parseFloat(domain.price).toFixed(2)} USD
                      </p>
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
                  placeholder="Enter code"
                  className="flex-1 px-4 py-2 bg-black/50 border border-white/20 rounded text-white placeholder-white/40"
                />
                <button className="px-6 py-2 bg-[#2349E2] hover:bg-[#2349E2]/80 text-white rounded transition">
                  Apply
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border border-[#2349E2] bg-black/30 backdrop-blur-md p-6 rounded-lg">
              <h3 className="text-white text-sm mb-6 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#2349E2]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                Order Summary
              </h3>

              {/* Subtotal */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                <span className="text-white/60 text-sm md:text-base">
                  Price per year
                </span>
                <div className="text-right">
                  <p className="text-white text-sm md:text-base">
                    {subtotal.toFixed(2)} USDC
                  </p>
                  <p className="text-white/40 text-xs">
                    ~${subtotal.toFixed(2)} USD
                  </p>
                </div>
              </div>

              {/* Years Selector */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-white/60 text-sm md:text-base">
                  Years
                </span>
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
                  <p className="text-white font-semibold text-lg">
                    {total.toFixed(2)} USDC
                  </p>
                  <p className="text-white/40 text-xs">~${usdValue} USD</p>
                </div>
              </div>

              {/* Payment Button - Daimo Pay or Traditional USDC */}
              {paymentMethod === "Daimo" ? (
                <div className="space-y-3">
                  {selectedDomains.some((d) => d.isChecked) && address ? (
                    <DaimoPayButton.Custom
                      {...prepareDaimoPayProps(
                        selectedDomains
                          .find((d) => d.isChecked)
                          ?.name.replace(/\.poly$/i, "") || "",
                        total.toFixed(2),
                        years,
                        address
                      )}
                    >
                      {({ show,  }) => {
                        return (
                          <button
                            onClick={show}
                            type="button"
                            className="w-full px-6 py-3 bg-[#2349E2] rounded hover:bg-[#1e3bc5] transition font-medium shadow-[0_0_15px_rgba(35,73,226,0.5)]"
                          >
                            Pay with Daimo
                          </button>
                        );
                      }}
                    </DaimoPayButton.Custom>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-[#2349E2] opacity-50 text-white font-medium py-3 rounded"
                    >
                      {!address ? "Connect Wallet" : "Select a Domain"}
                    </button>
                  )}

                  {paymentState.isComplete && (
                    <div className="p-3 bg-green-500/20 border border-green-500/30 rounded text-sm text-white flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Domain registered successfully!
                    </div>
                  )}

                  {paymentState.error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded text-sm text-white flex items-center gap-2">
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {paymentState.error}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={prepareConfirmation}
                  disabled={registering || !address || loadingPrice}
                  className="w-full bg-[#2349E2] hover:bg-[#2349E2]/80 disabled:opacity-50 text-white font-medium py-3 rounded transition"
                >
                  {loadingPrice
                    ? "Fetching prices..."
                    : registering
                    ? "Registering..."
                    : !address
                    ? "Connect Wallet"
                    : "Review & Confirm"}
                </button>
              )}

              {/* Confirmation panel (shown after preparing) */}
              {confirming && confirmData && (
                <div className="mt-4 p-4 bg-white/5 border border-[#2349E2]/30 rounded">
                  <p className="text-white text-sm mb-3">
                    Please confirm the following charges (will prompt your
                    wallet for USDC approval):
                  </p>
                  <div className="space-y-2 mb-3">
                    {confirmData.domains.map((d, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-white text-sm"
                      >
                        <span className="truncate pr-4">{d.name}</span>
                        <span className="whitespace-nowrap">
                          {parseFloat(d.price).toFixed(2)} USDC
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-white/80 text-sm mb-2">
                    <span>Price per year</span>
                    <span>{confirmData.subtotal.toFixed(2)} USDC</span>
                  </div>

                  <div className="flex justify-between text-white/80 text-sm mb-2">
                    <span>Duration</span>
                    <span>
                      {years} year{years > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex justify-between text-white font-bold text-base pt-2 border-t border-white/20 mb-4">
                    <span>Total</span>
                    <span>{confirmData.total.toFixed(2)} USDC</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfirming(false)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAndPay}
                      disabled={registering}
                      className="flex-1 px-4 py-2 bg-[#2349E2] text-white rounded hover:bg-[#2349E2]/80 disabled:opacity-50 transition"
                    >
                      {registering ? "Processing..." : "Confirm & Pay"}
                    </button>
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
                <svg
                  className="w-6 h-6 text-[#2349E2] shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-white/60 text-sm">
                  Extending for multiple years will save money on network cost
                  by avoiding yearly transactions.
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
                <div className="absolute top-3 left-0 right-0 flex justify-between px-1">
                  {/* 1-YEAR dot */}
                  <div className="relative" style={{ left: "13%" }}>
                    <div className="w-px h-6 bg-white "></div>
                    <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                  </div>

                  {/* 2-YEAR dot */}
                  <div className="relative" style={{ left: "0%" }}>
                    <div className="w-px h-6 bg-white "></div>
                    <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                  </div>

                  {/* 5-YEAR dot */}
                  <div className="relative" style={{ left: "-15%" }}>
                    <div className="w-px h-6 bg-white "></div>
                    <div className="w-2 h-2 bg-white absolute left-1/2 -translate-x-1/2 rotate-45"></div>
                  </div>
                </div>

                {/* Labels */}
                <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mt-4 pt-4">
                  <div>
                    <p className="text-white text-xs md:text-sm font-medium">
                      1-YEAR
                    </p>
                    <p className="text-white/60 text-[10px] md:text-xs mt-1">
                      2% discount
                    </p>
                  </div>

                  <div>
                    <p className="text-white text-xs md:text-sm font-medium">
                      2-YEAR
                    </p>
                    <p className="text-white/60 text-[10px] md:text-xs mt-1">
                      5% discount
                    </p>
                  </div>

                  <div>
                    <p className="text-white text-xs md:text-sm font-medium">
                      5-YEAR
                    </p>
                    <p className="text-white/60 text-[10px] md:text-xs mt-1">
                      9% discount
                    </p>
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
                <li>
                  <a href="#" className="hover:text-white transition">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>
        </motion.div>

        {/* Copyright */}
        <div className="text-center mt-12 pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm">
            © 2025 PNS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RegisterDomain;
