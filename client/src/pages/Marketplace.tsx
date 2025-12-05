import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { useAccount } from "wagmi";

// Cart item interface
interface CartItem {
  name: string;
  price: string;
  priceWei: string;
  years: number;
}

// Domain suggestion interface
interface DomainSuggestion {
  name: string;
  length: number;
  category: string;
  isAvailable: boolean | null;
  isChecking: boolean;
  price: string | null;
  priceWei: bigint | null;
}

// Word lists for generating domain suggestions
const prefixes = ["meta", "web", "crypto", "nft", "defi", "dao", "eth", "poly", "chain", "block", "smart", "token", "mint", "dex", "swap"];
const suffixes = ["hub", "lab", "fi", "verse", "world", "zone", "space", "io", "dev", "app", "pro", "network", "exchange", "wallet", "pay"];
const words = ["alpha", "beta", "gamma", "delta", "omega", "prime", "nova", "star", "moon", "sun", "sky", "cloud", "storm", "fire", "ice", "pixel", "cyber", "digital", "virtual", "quantum"];
const numbers = ["1", "2", "3", "7", "8", "9", "42", "69", "100", "420", "888", "999"];

// Categories
const categories = [
  { id: "all", label: "All Domains", icon: "🌐" },
  { id: "short", label: "Short (3-4 chars)", icon: "⚡" },
  { id: "crypto", label: "Crypto", icon: "₿" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "numbers", label: "Numbers", icon: "🔢" },
];

// Generate random domains
const generateDomains = (count: number): DomainSuggestion[] => {
  const domains: DomainSuggestion[] = [];
  const usedNames = new Set<string>();

  // Short domains (3-4 chars)
  const shortChars = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 5; i++) {
    let name = "";
    const len = Math.random() > 0.5 ? 3 : 4;
    for (let j = 0; j < len; j++) {
      name += shortChars[Math.floor(Math.random() * shortChars.length)];
    }
    if (!usedNames.has(name)) {
      usedNames.add(name);
      domains.push({ name, length: len, category: "short", isAvailable: null, isChecking: false, price: null, priceWei: null });
    }
  }

  // Crypto domains
  for (let i = 0; i < 8; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${prefix}${suffix}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      domains.push({ name, length: name.length, category: "crypto", isAvailable: null, isChecking: false, price: null, priceWei: null });
    }
  }

  // Gaming domains
  const gamingWords = ["gamer", "play", "game", "esport", "stream", "twitch", "guild", "clan", "team", "pro"];
  for (let i = 0; i < 6; i++) {
    const word1 = gamingWords[Math.floor(Math.random() * gamingWords.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const name = Math.random() > 0.5 ? `${word1}${word2}` : `${word2}${word1}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      domains.push({ name, length: name.length, category: "gaming", isAvailable: null, isChecking: false, price: null, priceWei: null });
    }
  }

  // Business domains
  const bizWords = ["corp", "inc", "global", "venture", "capital", "invest", "trade", "market", "finance", "wealth"];
  for (let i = 0; i < 6; i++) {
    const word = bizWords[Math.floor(Math.random() * bizWords.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${word}${suffix}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      domains.push({ name, length: name.length, category: "business", isAvailable: null, isChecking: false, price: null, priceWei: null });
    }
  }

  // Number domains
  for (let i = 0; i < 5; i++) {
    const num = numbers[Math.floor(Math.random() * numbers.length)];
    const word = words[Math.floor(Math.random() * words.length)];
    const name = Math.random() > 0.5 ? `${word}${num}` : `${num}${word}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      domains.push({ name, length: name.length, category: "numbers", isAvailable: null, isChecking: false, price: null, priceWei: null });
    }
  }

  // Shuffle array
  return domains.sort(() => Math.random() - 0.5).slice(0, count);
};

// Cart storage functions
const CART_KEY = "pns_cart";

const getCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (cart: CartItem[]) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export default function Marketplace() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { checkAvailability, getPrice } = useDomain();

  const [domains, setDomains] = useState<DomainSuggestion[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<DomainSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingIndex, setCheckingIndex] = useState<number | null>(null);

  // Load cart from storage on mount
  useEffect(() => {
    setCart(getCartFromStorage());
  }, []);

  // Generate domains on mount
  useEffect(() => {
    const generated = generateDomains(30);
    setDomains(generated);
    setFilteredDomains(generated);
    setIsLoading(false);
  }, []);

  // Filter domains by category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredDomains(domains);
    } else {
      setFilteredDomains(domains.filter(d => d.category === selectedCategory));
    }
  }, [selectedCategory, domains]);

  // Check availability and price for a domain
  const checkDomain = useCallback(async (index: number) => {
    const domain = filteredDomains[index];
    if (domain.isAvailable !== null || domain.isChecking) return;

    setCheckingIndex(index);
    setFilteredDomains(prev => prev.map((d, i) => 
      i === index ? { ...d, isChecking: true } : d
    ));

    try {
      const available = await checkAvailability(domain.name);
      let price: string | null = null;
      let priceWei: bigint | null = null;

      if (available) {
        const priceData = await getPrice(domain.name, 1);
        if (priceData) {
          price = priceData.price;
          priceWei = priceData.priceWei;
        }
      }

      setFilteredDomains(prev => prev.map((d, i) => 
        i === index ? { ...d, isAvailable: available ?? false, isChecking: false, price, priceWei } : d
      ));
      
      // Also update in main domains array
      setDomains(prev => prev.map(d => 
        d.name === domain.name ? { ...d, isAvailable: available ?? false, isChecking: false, price, priceWei } : d
      ));
    } catch (error) {
      console.error("Error checking domain:", error);
      setFilteredDomains(prev => prev.map((d, i) => 
        i === index ? { ...d, isAvailable: false, isChecking: false } : d
      ));
    } finally {
      setCheckingIndex(null);
    }
  }, [filteredDomains, checkAvailability, getPrice]);

  // Add to cart
  const addToCart = useCallback((domain: DomainSuggestion) => {
    if (!domain.price || !domain.priceWei) return;
    
    const newItem: CartItem = {
      name: domain.name,
      price: domain.price,
      priceWei: domain.priceWei.toString(),
      years: 1,
    };

    // Check if already in cart
    if (cart.some(item => item.name === domain.name)) {
      return;
    }

    const newCart = [...cart, newItem];
    setCart(newCart);
    saveCartToStorage(newCart);
  }, [cart]);

  // Remove from cart
  const removeFromCart = useCallback((name: string) => {
    const newCart = cart.filter(item => item.name !== name);
    setCart(newCart);
    saveCartToStorage(newCart);
  }, [cart]);

  // Update cart item years
  const updateCartYears = useCallback((name: string, years: number) => {
    const newCart = cart.map(item => 
      item.name === name ? { ...item, years: Math.max(1, Math.min(10, years)) } : item
    );
    setCart(newCart);
    saveCartToStorage(newCart);
  }, [cart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
    saveCartToStorage([]);
  }, []);

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    const price = parseFloat(item.price);
    return total + (price * item.years);
  }, 0);

  // Check if domain is in cart
  const isInCart = useCallback((name: string) => {
    return cart.some(item => item.name === name);
  }, [cart]);

  // Checkout - navigate to register page with first cart item
  const handleCheckout = () => {
    if (cart.length === 0) return;
    // Navigate to register page with domain and price as query params
    const firstItem = cart[0];
    navigate(`/register?domain=${firstItem.name}.poly&price=${firstItem.price}`);
  };

  // Refresh domains
  const refreshDomains = () => {
    setIsLoading(true);
    const generated = generateDomains(30);
    setDomains(generated);
    setFilteredDomains(selectedCategory === "all" ? generated : generated.filter(d => d.category === selectedCategory));
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--primary-gradient)" }}>
      <Navbar />

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setShowCart(false)}
            />
            
            {/* Cart Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0a0a12] border-l border-[rgba(255,255,255,0.06)] z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Your Cart</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-[var(--text-soft)] hover:text-white transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-[var(--text-soft)]">Your cart is empty</p>
                    <p className="text-sm text-[var(--text-soft)] mt-2">Add some domains to get started!</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <motion.div
                          key={item.name}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 100 }}
                          className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white font-semibold">{item.name}.poly</span>
                            <button
                              onClick={() => removeFromCart(item.name)}
                              className="text-red-400 hover:text-red-300 transition"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateCartYears(item.name, item.years - 1)}
                                className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] transition"
                              >
                                -
                              </button>
                              <span className="text-white w-16 text-center">{item.years} year{item.years > 1 ? 's' : ''}</span>
                              <button
                                onClick={() => updateCartYears(item.name, item.years + 1)}
                                className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.1)] transition"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[#2349E2] font-semibold">
                              {(parseFloat(item.price) * item.years).toFixed(2)} USDC
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t border-[rgba(255,255,255,0.06)] pt-4 space-y-4">
                      <div className="flex items-center justify-between text-lg">
                        <span className="text-[var(--text-soft)]">Total</span>
                        <span className="text-white font-bold">{cartTotal.toFixed(2)} USDC</span>
                      </div>
                      
                      <button
                        onClick={handleCheckout}
                        disabled={!address}
                        className="w-full py-4 rounded-xl bg-[#2349E2] text-white font-semibold hover:bg-[#1e3dc7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {address ? 'Checkout' : 'Connect Wallet to Checkout'}
                      </button>
                      
                      <button
                        onClick={clearCart}
                        className="w-full py-3 rounded-xl bg-transparent border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition"
                      >
                        Clear Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Domain Marketplace</h1>
            <p className="text-[var(--text-soft)]">Discover and register premium .poly domains</p>
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setShowCart(true)}
            className="relative flex items-center gap-3 px-6 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[#2349E2] transition"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-white font-medium">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#2349E2] text-white text-sm font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-8"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition ${
                selectedCategory === cat.id
                  ? "bg-[#2349E2] text-white"
                  : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
          
          {/* Refresh Button */}
          <button
            onClick={refreshDomains}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition ml-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </motion.div>

        {/* Domain Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#2349E2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--text-soft)]">Loading domains...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredDomains.map((domain, index) => (
              <motion.div
                key={domain.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 hover:border-[rgba(255,255,255,0.12)] transition group"
              >
                {/* Domain Name */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white group-hover:text-[#2349E2] transition">
                    {domain.name}<span className="text-[var(--text-soft)]">.poly</span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text-soft)]">
                      {domain.length} chars
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.05)] text-[var(--text-soft)] capitalize">
                      {domain.category}
                    </span>
                  </div>
                </div>

                {/* Availability Status */}
                {domain.isAvailable === null ? (
                  <button
                    onClick={() => checkDomain(index)}
                    disabled={domain.isChecking || checkingIndex !== null}
                    className="w-full py-3 rounded-xl bg-[rgba(255,255,255,0.05)] text-white font-medium hover:bg-[rgba(255,255,255,0.1)] transition disabled:opacity-50"
                  >
                    {domain.isChecking ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Checking...
                      </span>
                    ) : (
                      'Check Availability'
                    )}
                  </button>
                ) : domain.isAvailable ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Available
                      </span>
                      <span className="text-[#2349E2] font-bold">
                        {domain.price} USDC
                      </span>
                    </div>
                    
                    {isInCart(domain.name) ? (
                      <button
                        onClick={() => removeFromCart(domain.name)}
                        className="w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-semibold border border-green-500/30 hover:bg-green-500/30 transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        In Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(domain)}
                        className="w-full py-3 rounded-xl bg-[#2349E2] text-white font-semibold hover:bg-[#1e3dc7] transition flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-3 text-red-400 text-sm font-medium">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Taken
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDomains.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-[var(--text-soft)] text-lg">No domains found in this category</p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="mt-4 text-[#2349E2] hover:underline"
            >
              View all domains
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
