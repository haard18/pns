import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { useWallet } from "../contexts/WalletContext";

const ManageDomain = () => {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { renew, getDomainDetails,  } = useDomain();
  const { address } = useWallet();
  
  const [activeTab, setActiveTab] = useState<"records" | "subdomains" | "permissions">("records");
  const [domainDetails, setDomainDetails] = useState<any | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    const loadDomain = async () => {
      if (domainName) {
        const details = await getDomainDetails(domainName);
        setDomainDetails(details);
      }
    };
    loadDomain();
  }, [domainName, getDomainDetails]);

  // Sample data - replace with actual API calls
  const [records, setRecords] = useState([
    { key: "ETH Address", value: "0x1234...5678", type: "address" },
    { key: "BTC Address", value: "bc1q...xyz", type: "crypto" },
    { key: "Email", value: "user@example.com", type: "text" },
    { key: "Website", value: "https://example.com", type: "url" },
  ]);

  const [newRecord, setNewRecord] = useState({ key: "", value: "" });
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  const handleAddRecord = () => {
    if (newRecord.key && newRecord.value) {
      setRecords([...records, { ...newRecord, type: "text" }]);
      setNewRecord({ key: "", value: "" });
      setIsAddingRecord(false);
    }
  };

  const handleDeleteRecord = (index: number) => {
    setRecords(records.filter((_, i) => i !== index));
  };

  const handleRenewDomain = async () => {
    if (!domainName || !address) return;
    setRenewing(true);
    try {
      await renew(domainName, 1); // Renew for 1 year
      alert("Domain renewed successfully!");
      const details = await getDomainDetails(domainName);
      setDomainDetails(details);
    } catch (err) {
      console.error("Renewal failed:", err);
    } finally {
      setRenewing(false);
    }
  };

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
          <button
            onClick={() => navigate("/domains")}
            className="flex items-center gap-2 text-[var(--text-soft)] hover:text-white mb-4 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Domains
          </button>
          <h1 className="text-4xl text-white font-bold mb-2">{domainName}</h1>
          <div className="flex items-center gap-4 text-[var(--text-soft)]">
            <span>Owner: {address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'Unknown'}</span>
            <span>•</span>
            <span>Expires: {domainDetails?.expirationDate || 'Dec 25, 2026'}</span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button 
            onClick={handleRenewDomain}
            disabled={renewing}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 hover:border-[#2349E2] transition text-left group disabled:opacity-50"
          >
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-[#2349E2] transition">{renewing ? 'Renewing...' : 'Renew Domain'}</div>
            <div className="text-[var(--text-soft)] text-sm">Extend your domain ownership</div>
          </button>
          <button className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 hover:border-[#2349E2] transition text-left group">
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-[#2349E2] transition">Transfer Domain</div>
            <div className="text-[var(--text-soft)] text-sm">Transfer to another wallet</div>
          </button>
          <button className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 hover:border-red-500 transition text-left group">
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-red-500 transition">List for Sale</div>
            <div className="text-[var(--text-soft)] text-sm">Put your domain on the market</div>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setActiveTab("records")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "records"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab("subdomains")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "subdomains"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Subdomains
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              activeTab === "permissions"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Permissions
          </button>
        </motion.div>

        {/* Records Tab */}
        {activeTab === "records" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-white font-semibold">Domain Records</h2>
              <button
                onClick={() => setIsAddingRecord(!isAddingRecord)}
                className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition"
              >
                + Add Record
              </button>
            </div>

            {/* Add Record Form */}
            {isAddingRecord && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 mb-4"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Key (e.g., Email)"
                    value={newRecord.key}
                    onChange={(e) => setNewRecord({ ...newRecord, key: e.target.value })}
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2]"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newRecord.value}
                    onChange={(e) => setNewRecord({ ...newRecord, value: e.target.value })}
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2]"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddRecord}
                    className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition"
                  >
                    Save Record
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRecord(false);
                      setNewRecord({ key: "", value: "" });
                    }}
                    className="bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] px-6 py-2 rounded-lg font-medium border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {/* Records List */}
            <div className="space-y-3">
              {records.map((record, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 hover:border-[rgba(255,255,255,0.12)] transition group"
                  style={{ backdropFilter: "blur(10px)" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-[var(--text-soft)] text-sm mb-1">{record.key}</div>
                      <div className="text-white font-medium break-all">{record.value}</div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                      <button className="bg-[#2349E2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3dc7] transition">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(index)}
                        className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition border border-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {records.length === 0 && !isAddingRecord && (
              <div className="text-center py-12">
                <p className="text-[var(--text-soft)] text-lg mb-4">No records yet</p>
                <button
                  onClick={() => setIsAddingRecord(true)}
                  className="text-[#2349E2] hover:underline"
                >
                  Add your first record
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Subdomains Tab */}
        {activeTab === "subdomains" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-[var(--text-soft)] text-lg mb-4">No subdomains created</p>
            <button className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition">
              Create Subdomain
            </button>
          </motion.div>
        )}

        {/* Permissions Tab */}
        {activeTab === "permissions" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-8"
          >
            <h3 className="text-xl text-white font-semibold mb-6">Domain Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-white font-medium">Transfer Lock</div>
                  <div className="text-[var(--text-soft)] text-sm">Prevent domain transfers</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2349E2]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-white font-medium">Public Records</div>
                  <div className="text-[var(--text-soft)] text-sm">Make records publicly visible</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2349E2]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-white font-medium">Auto-Renew</div>
                  <div className="text-[var(--text-soft)] text-sm">Automatically renew before expiration</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2349E2]"></div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManageDomain;
