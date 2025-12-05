import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import { useDomain } from "../hooks/useDomain";
import { useAccount } from 'wagmi';
import { formatExpiration } from "../lib/namehash";

const ManageDomain = () => {
  const { domainName } = useParams<{ domainName: string }>();
  const navigate = useNavigate();
  const { renew, getDomainDetails, setTextRecord, getTextRecord, transferDomain, domain } = useDomain();
  const { address } = useAccount();
  
  const [activeTab, setActiveTab] = useState<"records" | "subdomains" | "permissions">("records");
  const [domainDetails, setDomainDetails] = useState<any | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);

  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Records state - loaded from contract
  const [records, setRecords] = useState<{ key: string; value: string; type: string }[]>([]);
  const [newRecord, setNewRecord] = useState({ key: "", value: "" });
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  
  // Ref to track if records have been loaded for current domain
  const recordsLoadedRef = useRef<string | null>(null);
  // Store functions in refs to avoid dependency issues causing infinite loops
  const getTextRecordRef = useRef(getTextRecord);
  getTextRecordRef.current = getTextRecord;
  const getDomainDetailsRef = useRef(getDomainDetails);
  getDomainDetailsRef.current = getDomainDetails;
  
  // Track if domain details have been loaded
  const domainLoadedRef = useRef<string | null>(null);

  // Load domain details on mount or when domain name changes
  useEffect(() => {
    if (!domainName) return;
    if (domainLoadedRef.current === domainName) return;
    
    domainLoadedRef.current = domainName;
    getDomainDetailsRef.current(domainName);
  }, [domainName]);

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
  useEffect(() => {
    if (!domainName) return;
    
    // Skip if already loaded for this domain
    if (recordsLoadedRef.current === domainName) return;
    
    const loadExistingRecords = async () => {
      setLoadingRecords(true);
      recordsLoadedRef.current = domainName;
      
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
            const value = await getTextRecordRef.current(domainName, key);
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

    loadExistingRecords();
  }, [domainName]);

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

  const handleTransferDomain = async () => {
    if (!domainName || !transferAddress) return;
    
    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(transferAddress)) {
      setTransferError('Invalid Ethereum address format');
      return;
    }

    setTransferring(true);
    setTransferError(null);

    try {
      await transferDomain(domainName, transferAddress);
      alert("Domain transfer transaction submitted! The domain will be transferred once confirmed.");
      setShowTransferModal(false);
      setTransferAddress("");
      // Refresh domain details
      await getDomainDetails(domainName);
    } catch (err: any) {
      console.error("Transfer failed:", err);
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--primary-gradient)" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-8 pb-10 md:pb-12">
        {/* Header */}
        <motion.div
          className="mb-6 md:mb-8"
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
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl text-white font-bold break-all">{domainName}</h1>
            {domainDetails?.owner && address && domainDetails.owner.toLowerCase() !== address.toLowerCase() && (
               <span className="text-yellow-500 text-sm md:mb-1.5">(You are not the owner)</span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-[var(--text-soft)] text-sm md:text-base">
            <span>Owner: {domainDetails?.owner ? `${domainDetails.owner.slice(0, 8)}...${domainDetails.owner.slice(-4)}` : 'Loading...'}</span>
            <span className="hidden sm:inline">•</span>
            <span>Expires: {domainDetails?.expirationDate || 'Loading...'}</span>
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
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 md:p-6 hover:border-[#2349E2] transition text-left group disabled:opacity-50"
          >
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-[#2349E2] transition">{renewing ? 'Renewing...' : 'Renew Domain'}</div>
            <div className="text-[var(--text-soft)] text-sm">Extend your domain ownership</div>
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            disabled={!domainDetails?.owner || domainDetails?.owner.toLowerCase() !== address?.toLowerCase()}
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 md:p-6 hover:border-[#2349E2] transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-[#2349E2] transition">Transfer Domain</div>
            <div className="text-[var(--text-soft)] text-sm">Transfer to another wallet</div>
          </button>
          <button className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 md:p-6 hover:border-red-500 transition text-left group">
            <div className="text-white text-lg font-semibold mb-2 group-hover:text-red-500 transition">List for Sale</div>
            <div className="text-[var(--text-soft)] text-sm">Put your domain on the market</div>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="flex gap-2 md:gap-3 mb-8 overflow-x-auto pb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm md:text-base ${
              activeTab === "records"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Records
          </button>
          <button
            onClick={() => setActiveTab("subdomains")}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm md:text-base ${
              activeTab === "subdomains"
                ? "bg-[#2349E2] text-white"
                : "bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"
            }`}
          >
            Subdomains
          </button>
          <button
            onClick={() => setActiveTab("permissions")}
            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm md:text-base ${
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl md:text-2xl text-white font-semibold">Domain Records</h2>
              <button
                onClick={() => setIsAddingRecord(!isAddingRecord)}
                disabled={savingRecord}
                className="bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50 w-full sm:w-auto"
              >
                + Add Record
              </button>
            </div>

            {/* Status Messages */}
            {recordError && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {recordError}
              </div>
            )}
            {recordSuccess && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                {recordSuccess}
              </div>
            )}

            {/* Add Record Form */}
            {isAddingRecord && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 md:p-6 mb-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <select
                    value={newRecord.key}
                    onChange={(e) => setNewRecord({ ...newRecord, key: e.target.value })}
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#2349E2] w-full"
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
                    className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddRecord}
                    disabled={savingRecord || !newRecord.key || !newRecord.value}
                    className="flex-1 md:flex-none bg-[#2349E2] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50"
                  >
                    {savingRecord ? 'Saving...' : 'Save Record'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRecord(false);
                      setNewRecord({ key: "", value: "" });
                    }}
                    className="flex-1 md:flex-none bg-[rgba(255,255,255,0.02)] text-[var(--text-soft)] px-6 py-2 rounded-lg font-medium border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] transition"
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
                    className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 md:p-5 hover:border-[rgba(255,255,255,0.12)] transition group"
                    style={{ backdropFilter: "blur(10px)" }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--text-soft)] text-xs md:text-sm mb-1">{record.key}</div>
                        <div className="text-white font-medium break-all text-sm md:text-base">{record.value}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteRecord(index)}
                          disabled={savingRecord}
                          className="bg-red-500/10 text-red-500 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium hover:bg-red-500/20 transition border border-red-500/20 disabled:opacity-50 opacity-100 md:opacity-0 md:group-hover:opacity-100"
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
            className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-lg p-5 md:p-8"
          >
            <h3 className="text-lg md:text-xl text-white font-semibold mb-6">Domain Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-white font-medium text-sm md:text-base">Transfer Lock</div>
                  <div className="text-[var(--text-soft)] text-xs md:text-sm">Prevent domain transfers</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2349E2]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-white font-medium text-sm md:text-base">Public Records</div>
                  <div className="text-[var(--text-soft)] text-xs md:text-sm">Make records publicly visible</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2349E2]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-white font-medium text-sm md:text-base">Auto-Renew</div>
                  <div className="text-[var(--text-soft)] text-xs md:text-sm">Automatically renew before expiration</div>
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

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-[rgba(255,255,255,0.1)] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl text-white font-bold mb-4">Transfer Domain</h3>
            <p className="text-[var(--text-soft)] text-sm mb-4">
              Transfer <span className="text-white font-medium">{domainName}.poly</span> to another wallet. This action cannot be undone.
            </p>
            {transferError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4">
                <p className="text-red-400 text-sm">{transferError}</p>
              </div>
            )}
            <input
              type="text"
              placeholder="Recipient address (0x...)"
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] mb-4 focus:outline-none focus:border-[#2349E2]"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAddress('');
                  setTransferError(null);
                }}
                className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.1)] rounded-lg text-white hover:bg-[rgba(255,255,255,0.05)] transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleTransferDomain}
                disabled={transferring || !transferAddress}
                className="flex-1 px-4 py-3 bg-[#2349E2] rounded-lg text-white font-medium hover:bg-[#1a3ab8] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDomain;
