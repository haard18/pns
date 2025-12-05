import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { formatDomainName, formatNumber } from "../services/pnsApi";

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: "easeInOut" } 
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.38, ease: "easeInOut" } 
  },
};

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};


const Search: React.FC = () => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestedDomains, setSuggestedDomains] = useState<string[]>([]);
  const navigate = useNavigate();

  const { checkAvailability, getPrice, isLoading, error } = useDomain();

  const [searchResults, setSearchResults] = useState<
    | {
        name: string;
        price: string;
        currency: string;
        available: boolean;
      }
    | null
  >(null);

  async function handleSearch() {
    const q = searchInput.trim();
    if (!q) return;

    try {
      const formatted = formatDomainName(q);
      const available = await checkAvailability(formatted);

      if (available) {
        const priceData = await getPrice(formatted);
        const results = {
          name: formatted,
          price: priceData?.price ?? "0",
          currency: priceData?.currency ?? "USDC",
          available: true,
        };
        setSearchResults(results);
        // clear suggestions when we have a direct hit
        setSuggestedDomains([]);
      } else {
        // domain unavailable — set results with available=false and generate friendly suggestions
        setSearchResults({ name: formatted, price: "0", currency: "USDC", available: false });
        // lightweight suggestion generator — tweak as needed
        const base = formatted.replace(/\.poly$/i, "");
        const suggestions = [
          `${base}01.poly`,
          `${base}xyz.poly`,
          `${base}-dev.poly`,
          `${base}app.poly`,
        ];
        setSuggestedDomains(suggestions);
      }
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  return (
    <motion.div
      className="min-h-screen w-full text-[var(--text-light)] px-6 py-10"
      style={{ background: "var(--primary-gradient)" }}
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.02 } } }}
    >
      <Navbar />

      <motion.h1 className="text-4xl mb-8 tracking-wider" variants={fadeInUp} initial="hidden" animate="show">
        Search Your .poly Domain
      </motion.h1>

      {/* Search Bar */}
      <motion.div
        className="flex gap-4 max-w-3xl"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.input
          type="text"
          placeholder="Search Domains (e.g., myname)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] px-4 py-3 rounded-md outline-none text-white placeholder-white/50"
          variants={fadeInUp}
        />

        <motion.button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-8 py-3 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md disabled:opacity-50"
          variants={fadeInUp}
        >
          {isLoading ? "Searching..." : "Search"}
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <motion.div className="grid grid-cols-1  text-[var(--text-soft)] lg:grid-cols-2 gap-8 mt-12" variants={containerVariants} initial="hidden" animate="show">
        {/* Search Results (left) */}
        <div>
          <AnimatePresence>
            {searchResults ? (
              <motion.section
                key="search-results"
                className=""
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeInUp}
              >
                <p className="text-[var(--text-soft)] mb-3">Search Results</p>

                <motion.div className="border border-[#2349E2]/50 rounded-lg p-5" variants={scaleIn} initial="hidden" animate="show" exit={{ opacity: 0, scale: 0.96 }}>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start text-[var(--text-soft)]">
                      <div>
                        <p className="text-sm text-[var(--text-soft)] mb-1">Domain</p>
                        <span className="text-xl font-semibold text-[var(--text-soft)]">{searchResults.name}</span>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-[var(--text-soft)] mb-1">Price</p>
                        <span className={`text-md font-bold ${searchResults.available ? "text-green-400" : "text-red-400"}`}>
                          {searchResults.available ? `${parseFloat(searchResults.price).toFixed(4)} ${searchResults.currency}` : "Unavailable"}
                        </span>

                        {searchResults.available && (
                          <p className="text-xs text-gray-400 mt-1">≈ ${formatNumber((parseFloat(searchResults.price) * 0.8).toFixed(2))}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <motion.button whileHover={{ scale: 1.03 }} disabled={!searchResults.available} className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)] rounded-md transition disabled:opacity-50">
                      Add to Cart
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      disabled={!searchResults.available}
                      onClick={() => {
                        const domainName = searchResults.name.includes(".poly") ? searchResults.name : `${searchResults.name}.poly`;
                        navigate(`/register?domain=${encodeURIComponent(domainName)}&price=${encodeURIComponent(searchResults.price)}`);
                      }}
                      className="flex-1 px-4 py-3 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md disabled:opacity-50"
                    >
                      Register Now
                    </motion.button>
                  </div>
                </motion.div>
              </motion.section>
            ) : (
              <motion.div key="empty-state" className="col-span-full text-center py-12" variants={fadeInUp} initial="hidden" animate="show">
                <p className="text-[var(--text-soft)]">Search for a domain to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestions (right) */}
        <div>
          {/* Suggestions always rendered, AnimatePresence only for children */}
          {suggestedDomains.length > 0 && (
            <motion.aside
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeInUp}
              key="suggestions"
            >
              <div className="flex justify-between items-center mb-3">
                <p className="text-[var(--text-soft)]">Alternative Suggestions</p>
              </div>
              <motion.div className="space-y-3" variants={containerVariants} initial="hidden" animate="show">
                <AnimatePresence>
                  {suggestedDomains.map((domain) => (
                    <motion.div
                      key={domain}
                      className="flex justify-between items-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg hover:border-[#2349E2]/50 transition"
                      variants={scaleIn}
                      initial="hidden"
                      animate="show"
                      exit={{ opacity: 0, scale: 0.96 }}
                    >
                      <span className="text-white">{domain}</span>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={() => {
                            setSearchInput(domain.replace(".poly", ""));
                            handleSearch();
                          }}
                          className="px-3 py-2 border border-[rgba(255,255,255,0.2)] rounded-md hover:bg-[rgba(255,255,255,0.08)] transition"
                        >
                          Check
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          onClick={async () => {
                            // Fetch price before redirecting
                            const formatted = domain.replace(/\.poly$/i, "");
                            let price = "0";
                            try {
                              const priceData = await getPrice(formatted);
                              price = priceData?.price ?? "0";
                            } catch (err) {
                              price = "0";
                            }
                            navigate(`/register?domain=${encodeURIComponent(domain)}&price=${encodeURIComponent(price)}`);
                          }}
                          className="px-3 py-2 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md"
                        >
                          Register
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.aside>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Search;
