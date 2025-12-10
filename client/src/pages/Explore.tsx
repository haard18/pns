import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { getAllDomains, formatAddress, formatDomainName } from "../services/pnsApi";

interface DomainItem {
  name: string;
  name_hash?: string;
  owner: string;
  expiration?: number;
  resolver?: string;
  created_at?: string;
  updated_at?: string;
  last_updated_tx?: string;
}

const Explore = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  useEffect(() => {
    loadDomains();
  }, [page]);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const result = await getAllDomains(page, limit);
      console.log("Domains loaded:", result);
      if (result && result.domains) {
        setDomains(result.domains);
        setTotal(result.total || 0);
      } else {
        console.warn("Unexpected result format:", result);
        setDomains([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Error loading domains:", error);
      setDomains([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = domains.filter((domain) =>
    (domain.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatExpiration = (expiration?: number | string | null): string => {
    if (!expiration) return "N/A";
    // Handle both string and number formats
    const expNum = typeof expiration === 'string' ? parseInt(expiration) : Number(expiration);
    if (isNaN(expNum) || expNum === 0) return "N/A";
    // Check if it's in seconds (Unix timestamp) or milliseconds
    const timestamp = expNum > 1000000000000 ? expNum : expNum * 1000;
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const isExpired = (expiration?: number | string | null): boolean => {
    if (!expiration) return false;
    const expNum = typeof expiration === 'string' ? parseInt(expiration) : Number(expiration);
    if (isNaN(expNum) || expNum === 0) return false;
    // Check if it's in seconds (Unix timestamp) or milliseconds
    const timestamp = expNum > 1000000000000 ? expNum : expNum * 1000;
    return timestamp < Date.now();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--primary-gradient)" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl text-white font-bold mb-2">Explore All Domains</h1>
          <p className="text-[var(--text-soft)] text-sm">
            Discover all registered .poly domains on the blockchain
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6" style={{ backdropFilter: "blur(10px)" }}>
            <div className="text-[var(--text-soft)] text-sm mb-2">Total Domains</div>
            <div className="text-white text-2xl font-semibold">{total.toLocaleString()}</div>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6" style={{ backdropFilter: "blur(10px)" }}>
            <div className="text-[var(--text-soft)] text-sm mb-2">Current Page</div>
            <div className="text-white text-2xl font-semibold">{page} / {totalPages}</div>
          </div>
          <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6" style={{ backdropFilter: "blur(10px)" }}>
            <div className="text-[var(--text-soft)] text-sm mb-2">Showing</div>
            <div className="text-white text-2xl font-semibold">{domains.length} domains</div>
          </div>
        </motion.div>

        {/* Search and View Controls */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search domains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 pl-10 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2]"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-soft)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition ${
                viewMode === "list" ? "bg-[#2349E2] text-white" : "text-[var(--text-soft)] hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition ${
                viewMode === "grid" ? "bg-[#2349E2] text-white" : "text-[var(--text-soft)] hover:text-white"
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2349E2]"></div>
            <p className="text-[var(--text-soft)] mt-4">Loading domains...</p>
          </div>
        )}

        {/* Domain List/Grid */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-3"}>
              {filteredDomains.map((domain, index) => (
                <motion.div
                  key={domain.name_hash || domain.name || `domain-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={`bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg hover:border-[rgba(255,255,255,0.12)] transition group relative overflow-hidden ${
                    viewMode === "grid" ? "p-0 h-[320px]" : "p-5 flex items-center justify-between"
                  }`}
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Vibrant Blue Circuit Board Background */}
                      <div 
                        className="absolute inset-0" 
                        style={{
                          background: isExpired(domain.expiration)
                            ? 'linear-gradient(135deg, #333 0%, #555 50%, #333 100%)'
                            : 'linear-gradient(135deg, #0033CC 0%, #0052FF 50%, #0033CC 100%)',
                        }}
                      >
                        {/* Circuit Grid Pattern */}
                        <div className="absolute inset-0" style={{
                          backgroundImage: `
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(180deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
                          `,
                          backgroundSize: '30px 30px',
                        }}></div>
                        
                        {/* Circuit Lines */}
                        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                          <line x1="15%" y1="0" x2="15%" y2="100%" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                          <line x1="85%" y1="0" x2="85%" y2="100%" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1" />
                          <circle cx="15%" cy="50%" r="3" fill="rgba(255, 255, 255, 0.4)" />
                          <circle cx="85%" cy="50%" r="3" fill="rgba(255, 255, 255, 0.4)" />
                        </svg>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-6">
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="text-white font-semibold text-2xl text-center mb-2">
                            {formatDomainName(domain.name || '')}
                          </div>
                          {isExpired(domain.expiration) && (
                            <div className="text-red-400 text-xs text-center mb-2">EXPIRED</div>
                          )}
                          <div className="text-white/70 text-sm text-center mb-4">
                            Owner: {formatAddress(domain.owner || '')}
                          </div>
                          {domain.expiration && (
                            <div className="text-white/60 text-xs text-center">
                              Expires: {formatExpiration(domain.expiration)}
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={() => navigate(`/search?query=${encodeURIComponent(domain.name.replace('.poly', ''))}`)}
                          className="w-full bg-[rgba(0,20,80,0.5)] text-white px-4 py-3 rounded-lg font-medium hover:bg-[rgba(0,20,80,0.7)] transition border border-[rgba(255,255,255,0.2)] backdrop-blur-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="text-white font-medium text-lg mb-1">
                          {formatDomainName(domain.name || '')}
                          {isExpired(domain.expiration) && (
                            <span className="ml-2 text-red-400 text-xs">EXPIRED</span>
                          )}
                        </div>
                        <div className="text-[var(--text-soft)] text-sm">
                          Owner: {formatAddress(domain.owner || '')}
                        </div>
                        {domain.expiration && (
                          <div className="text-[var(--text-soft)] text-xs mt-1">
                            Expires: {formatExpiration(domain.expiration)}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => navigate(`/search?query=${encodeURIComponent((domain.name || '').replace('.poly', ''))}`)}
                        className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition opacity-0 group-hover:opacity-100"
                      >
                        View Details
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredDomains.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-[var(--text-soft)] text-lg">
                  {searchQuery ? "No domains found matching your search" : "No domains found"}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <motion.div
            className="flex items-center justify-center gap-4 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[rgba(255,255,255,0.12)] transition"
            >
              Previous
            </button>
            <span className="text-[var(--text-soft)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-[rgba(255,255,255,0.12)] transition"
            >
              Next
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Explore;

