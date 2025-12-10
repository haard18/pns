import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useAccount } from 'wagmi';
import { useDomain } from "../hooks/useDomain";
import bg from '../assets/nft.png';
interface DomainItem {
  name: string;
}

const Domain = () => {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { getUserDomains } = useDomain();
  
  const [activeTab, setActiveTab] = useState<"collections" | "cart" | "registrar">("collections");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [collections, setCollections] = useState<DomainItem[]>([]);

  useEffect(() => {
    const loadDomains = async () => {
      if (address) {
        const domains = await getUserDomains(address);
        setCollections(domains.map(d => ({ name: d.name })));
      }
    };
    loadDomains();
  }, [address, getUserDomains]);

  const filteredCollections = collections.filter((domain) =>
    domain.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { label: "Total domains", value: collections.length.toString() },
    { label: "Portfolio value", value: "$0.00" },
    { label: "Domains bought", value: "0" },
    { label: "Domains sold", value: "0" },
    { label: "Highest sale", value: "-" },
    { label: "Profit & Loss", value: "$0.00" },
  ];

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
          <h1 className="text-4xl text-white font-bold mb-2">Your Domains</h1>
          <div className="flex items-center gap-2 text-[var(--text-soft)]">
            <span>{address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'Connect wallet'}</span>
            <button className="w-4 h-4 flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6"
              style={{ backdropFilter: "blur(10px)" }}
            >
              <div className="text-[var(--text-soft)] text-sm mb-2">{stat.label}</div>
              <div className="text-white text-2xl font-semibold">{stat.value}</div>
            </div>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setActiveTab("collections")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "collections"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab("cart")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "cart"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Added to Cart
          </button>
          <button
            onClick={() => setActiveTab("registrar")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "registrar"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Registrar
          </button>
        </motion.div>

        {/* Collections Section */}
        {activeTab === "collections" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Title and Controls */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-white font-semibold">Your Collections</h2>
              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search your collections"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 pl-10 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] w-80"
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
              </div>
            </div>

            {/* Domain List/Grid */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-3"}>
              {filteredCollections.map((domain, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className={`bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg hover:border-[rgba(255,255,255,0.12)] transition group relative overflow-hidden ${
                    viewMode === "grid" ? "p-0 h-[280px]" : "p-5 flex items-center justify-between"
                  }`}
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  {viewMode === "grid" ? (
                    <>
                      {/* Vibrant Blue Circuit Board Background */}
                           <div 
                        className="absolute inset-0" 
                        style={{
                          backgroundImage: `url(${bg})`,
                          backgroundPosition: 'center center',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >    
                        {/* Circuit Grid Pattern */}
                        
                        
                        {/* Circuit Lines */}
                       
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-6">
                        <div className="flex-1 flex items-center justify-center">
                          <div className="text-white font-semibold text-2xl text-center">{domain.name}</div>
                        </div>
                        <button 
                          onClick={() => navigate(`/manage/${domain.name}`)}
                          className="w-full bg-[rgba(0,20,80,0.5)] text-white px-4 py-3 rounded-lg font-medium hover:bg-[rgba(0,20,80,0.7)] transition border border-[rgba(255,255,255,0.2)] backdrop-blur-sm"
                        >
                          Manage Domain
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-white font-medium text-lg">{domain.name}</div>
                      <button 
                        onClick={() => navigate(`/manage/${domain.name}`)}
                        className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition opacity-0 group-hover:opacity-100"
                      >
                        Manage Domain
                      </button>
                    </>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredCollections.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-soft)] text-lg">No domains found</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Cart Tab */}
        {activeTab === "cart" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-[var(--text-soft)] text-lg">Your cart is empty</p>
          </motion.div>
        )}

        {/* Registrar Tab */}
        {activeTab === "registrar" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-[var(--text-soft)] text-lg">No registered domains</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Domain;
