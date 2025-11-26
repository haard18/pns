import { useState } from "react";
import "../App.css";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { formatDomainName, formatNumber } from "../services/pnsApi";

const Search = () => {
  const [searchInput, setSearchInput] = useState("");
  const [suggestedDomains, setSuggestedDomains] = useState<string[]>([]);
  const { checkAvailability, getPrice, isLoading, error } = useDomain();
  const [searchResults, setSearchResults] = useState<{
    name: string;
    price: string;
    available: boolean;
  } | null>(null);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    const formatted = formatDomainName(searchInput);
    const available = await checkAvailability(formatted);
    
    if (available) {
      const priceData = await getPrice(formatted);
      setSearchResults({
        name: formatted,
        price: priceData?.price || "0",
        available: true,
      });
    } else {
      setSearchResults({
        name: formatted,
        price: "N/A",
        available: false,
      });
    }

    // Generate suggestions
    const baseName = searchInput.toLowerCase().replace(".poly", "");
    const suggestions = [
      `${baseName}ai.poly`,
      `${baseName}x.poly`,
      `${baseName}io.poly`,
      `${baseName}pro.poly`,
      `${baseName}app.poly`,
    ];
    setSuggestedDomains(suggestions);
  };

  return (
    <motion.div
      className="min-h-screen w-full text-[var(--text-light)] px-6 py-10"
      style={{ background: "var(--primary-gradient)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar />

      {/* Page Title */}
      <motion.h1
        className="text-4xl mb-8 tracking-wider"
      >
        Search Your .poly Domain
      </motion.h1>

      {/* Search Bar Container */}
      <motion.div
        className="flex gap-4 max-w-3xl"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.input
          type="text"
          placeholder="Search Domains (e.g., myname)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] px-4 py-3 rounded-md outline-none text-white placeholder-white/50"
        />

        <motion.button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-8 py-3 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Search"}
        </motion.button>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Layout Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Left Box - Search Results */}
        {searchResults && (
          <motion.div variants={fadeInUp}>
            <p className="text-[var(--text-soft)] mb-3">Search Results</p>

            <motion.div
              className="bg-[rgba(255,255,255,0.05)] border border-[#2349E2]/50 rounded-lg p-5"
              variants={scaleIn}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-semibold">{searchResults.name}</span>
                <span className={`text-md font-bold ${searchResults.available ? 'text-green-400' : 'text-red-400'}`}>
                  {searchResults.available ? `${formatNumber(searchResults.price)} ETH` : 'Unavailable'}
                </span>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  disabled={!searchResults.available}
                  className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)] rounded-md transition disabled:opacity-50"
                >
                  Add to Cart
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  disabled={!searchResults.available}
                  onClick={() => window.location.href = `/register?domain=${searchResults.name}`}
                  className="flex-1 px-4 py-3 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md disabled:opacity-50"
                >
                  Register Now
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Right Box - Suggestions */}
        {suggestedDomains.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="flex justify-between items-center mb-3">
              <p className="text-[var(--text-soft)]">Alternative Suggestions</p>
            </div>

            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {suggestedDomains.map((domain) => (
                <motion.div
                  key={domain}
                  className="flex justify-between items-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg hover:border-[#2349E2]/50 transition"
                  variants={scaleIn}
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
                      onClick={() => window.location.href = `/register?domain=${domain}`}
                      className="px-3 py-2 bg-[#2349E2] hover:bg-[#1e3bc5] transition rounded-md"
                    >
                      Register
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Empty State */}
        {!searchResults && suggestedDomains.length === 0 && (
          <motion.div
            variants={fadeInUp}
            className="col-span-full text-center py-12"
          >
            <p className="text-[var(--text-soft)]">Search for a domain to get started</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Search;
