import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { useAccount } from 'wagmi';
import { formatExpiration } from "../lib/namehash";

const ManageDomain = () => {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { renew, getDomainDetails, setTextRecord, getTextRecord, domain } = useDomain();
  const { address } = useAccount();
  
  const [activeTab, setActiveTab] = useState<"records" | "subdomains" | "permissions">("records");
  const [domainDetails, setDomainDetails] = useState<any | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);

  // Records state - loaded from contract
  const [records, setRecords] = useState<{ key: string; value: string; type: string }[]>([]);
  const [newRecord, setNewRecord] = useState({ key: "", value: "" });
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Load domain details and existing records
  useEffect(() => {
    const loadDomain = async () => {
      if (domainName) {
        await getDomainDetails(domainName);
        await loadExistingRecords();
      }
    };
    loadDomain();
  }, [domainName, getDomainDetails]);

  // Update domainDetails when domain changes
  useEffect(() => {
    if (domain) {
      setDomainDetails({
        ...domain,
        expirationDate: formatExpiration(domain.expiration)
      });
    }
  }, [domain]);

  // Load existing text records from the resolver
  const loadExistingRecords = async () => {
    if (!domainName) return;
    setLoadingRecords(true);
    
    try {
      // Common record keys to check
      const commonKeys = [
        { key: 'url', label: 'Website' },
        { key: 'email', label: 'Email' },
        { key: 'avatar', label: 'Avatar' },
        { key: 'description', label: 'Description' },
        { key: 'com.twitter', label: 'Twitter' },
        { key: 'com.github', label: 'GitHub' },
        { key: 'com.discord', label: 'Discord' },
        { key: 'org.telegram', label: 'Telegram' },
        { key: 'contentHash', label: 'IPFS' },
      ];
      
      const loadedRecords: { key: string; value: string; type: string }[] = [];
      
      for (const { key, label } of commonKeys) {
        try {
          const value = await getTextRecord(domainName, key);
          if (value) {
            loadedRecords.push({ key: label, value, type: 'text' });
          }
        } catch (err) {
          // Record doesn't exist, skip
        }
      }
      
      setRecords(loadedRecords);
    } catch (err) {
      console.error('Error loading records:', err);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Map display label to actual record key
  const getRecordKey = (displayKey: string): string => {
    const keyMap: { [key: string]: string } = {
      'Website': 'url',
      'Email': 'email',
      'Avatar': 'avatar',
      'Description': 'description',
      'Twitter': 'com.twitter',
      'GitHub': 'com.github',
      'Discord': 'com.discord',
      'Telegram': 'org.telegram',
      'IPFS': 'contentHash',
    };
    return keyMap[displayKey] || displayKey.toLowerCase();
  };

  const handleAddRecord = async () => {
    if (!newRecord.key || !newRecord.value || !domainName) return;
    
    setSavingRecord(true);
    setRecordError(null);
    setRecordSuccess(null);
    
    try {
      const recordKey = getRecordKey(newRecord.key);
      await setTextRecord(domainName, recordKey, newRecord.value);
      
      // Add to local state
      setRecords([...records, { key: newRecord.key, value: newRecord.value, type: "text" }]);
      setNewRecord({ key: "", value: "" });
      setIsAddingRecord(false);
      setRecordSuccess('Record saved! Transaction submitted.');
      setTimeout(() => setRecordSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding record:', err);
      setRecordError(err.message || 'Failed to add record');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (index: number) => {
    const record = records[index];
    if (!domainName) return;
    
    setSavingRecord(true);
    setRecordError(null);
    
    try {
      const recordKey = getRecordKey(record.key);
      // Set to empty string to "delete" the record
      await setTextRecord(domainName, recordKey, '');
      
      // Remove from local state
      setRecords(records.filter((_, i) => i !== index));
      setRecordSuccess('Record deleted! Transaction submitted.');
      setTimeout(() => setRecordSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting record:', err);
      setRecordError(err.message || 'Failed to delete record');
    } finally {
      setSavingRecord(false);
    }
  };

  const handleRenewDomain = async () => {
    if (!domainName || !address) return;
    setRenewing(true);
    try {
      await renew(domainName, 1); // Renew for 1 year
      alert("Domain renewal transaction submitted!");
      // Refresh domain details
      await getDomainDetails(domainName);
    } catch (err) {
      console.error("Renewal failed:", err);
      alert(`Renewal failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
                disabled={savingRecord}
                className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50"
              >
                + Add Record
              </button>
            </div>

            {/* Status Messages */}
            {recordError && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {recordError}
              </div>
            )}
            {recordSuccess && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200">
                {recordSuccess}
              </div>
            )}

            {/* Add Record Form */}
            {isAddingRecord && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-6 mb-4"
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <select
                    value={newRecord.key}
                    onChange={(e) => setNewRecord({ ...newRecord, key: e.target.value })}
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2349E2]"
                  >
                    <option value="">Select record type...</option>
                    <option value="Website">Website</option>
                    <option value="Email">Email</option>
                    <option value="Avatar">Avatar URL</option>
                    <option value="Description">Description</option>
                    <option value="Twitter">Twitter</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Discord">Discord</option>
                    <option value="Telegram">Telegram</option>
                    <option value="IPFS">IPFS Content Hash</option>
                  </select>
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
                    disabled={savingRecord || !newRecord.key || !newRecord.value}
                    className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50"
                  >
                    {savingRecord ? 'Saving...' : 'Save Record'}
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

            {/* Loading State */}
            {loadingRecords && (
              <div className="text-center py-12">
                <p className="text-[var(--text-soft)] text-lg">Loading records...</p>
              </div>
            )}

            {/* Records List */}
            {!loadingRecords && (
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
                        <button
                          onClick={() => handleDeleteRecord(index)}
                          disabled={savingRecord}
                          className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-500/20 transition border border-red-500/20 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loadingRecords && records.length === 0 && !isAddingRecord && (
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
