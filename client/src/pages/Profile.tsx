import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { useDomain } from "../hooks/useDomain";
import Navbar from "../components/Navbar";

// Import social icons
import internetIcon from "../assets/internet.svg";
import githubIcon from "../assets/github.svg";
import discordIcon from "../assets/discord.svg";
import telegramIcon from "../assets/tg.svg";
import twitterIcon from "../assets/x.svg";
import emailIcon from "../assets/email.svg";
const rightTabs = ["Domain Settings", "Subdomains", "Advanced", "Activity"];

const container = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, when: "beforeChildren" },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.45 } },
};

export default function DomainProfile() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const {
    getUserDomains,
    setTextRecord,
    getTextRecord,
    setAddressRecord,
    getAddressRecord,
    transferDomain,
  } = useDomain();

  const [activeTab, setActiveTab] = useState("Domain Settings");
  const [showSocialsModal, setShowSocialsModal] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [showOtherRecordsModal, setShowOtherRecordsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [userDomains, setUserDomains] = useState<any[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadDomains = async () => {
      if (address) {
        const domains = await getUserDomains(address);
        setUserDomains(domains);
        if (domains.length > 0) {
          setSelectedDomain(domains[0]);
          loadExistingRecords(domains[0].name);
        }
      }
    };
    loadDomains();
  }, [address, getUserDomains]);

  // Load existing records from the resolver
  const loadExistingRecords = async (domainName: string) => {
    try {
      const [website, twitter, telegram, discord, email, github] =
        await Promise.all([
          getTextRecord(domainName, "url"),
          getTextRecord(domainName, "com.twitter"),
          getTextRecord(domainName, "org.telegram"),
          getTextRecord(domainName, "com.discord"),
          getTextRecord(domainName, "email"),
          getTextRecord(domainName, "com.github"),
        ]);

      setSocials({ website, twitter, telegram, discord, email, github });

      // Load polygon address record (coinType 60 for ETH-compatible)
      const polygonAddr = await getAddressRecord(domainName, 60);
      setPolygonAddress(polygonAddr);

      // Load other records
      const [ipfs, arwv, ipns] = await Promise.all([
        getTextRecord(domainName, "contentHash"),
        getTextRecord(domainName, "arweave"),
        getTextRecord(domainName, "ipns"),
      ]);
      setOtherRecords((prev) => ({ ...prev, ipfs, arwv, ipns }));
    } catch (err) {
      console.error("Error loading existing records:", err);
    }
  };

  const [socials, setSocials] = useState({
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    email: "",
    github: "",
  });
  const [polygonAddress, setPolygonAddress] = useState("");
  const [otherRecords, setOtherRecords] = useState({
    ipfs: "",
    arwv: "",
    shdw: "",
    ipns: "",
    dnsA: "",
    dnsAAAA: "",
    dnsCNAME: "",
    dnsTXT: "",
  });
  const [transferAddress, setTransferAddress] = useState("");
  const [transferConfirmed, setTransferConfirmed] = useState(false);

  const handleSocialChange = (field: string, value: string) => {
    setSocials((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSocials = async () => {
    if (!selectedDomain?.name) {
      setSaveError("No domain selected");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Map social fields to standard text record keys
      const recordsToSave = [
        { key: "url", value: socials.website },
        { key: "com.twitter", value: socials.twitter },
        { key: "org.telegram", value: socials.telegram },
        { key: "com.discord", value: socials.discord },
        { key: "email", value: socials.email },
        { key: "com.github", value: socials.github },
      ].filter((r) => r.value); // Only save non-empty values

      for (const record of recordsToSave) {
        await setTextRecord(selectedDomain.name, record.key, record.value);
      }

      setSaveSuccess(
        "Social records saved successfully! Transaction(s) submitted."
      );
      setTimeout(() => {
        setShowSocialsModal(false);
        setSaveSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error("Error saving socials:", err);
      setSaveError(err.message || "Failed to save social records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedDomain?.name || !polygonAddress) {
      setSaveError("Please enter an address");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // CoinType 60 = Ethereum/Polygon address
      await setAddressRecord(selectedDomain.name, 60, polygonAddress);
      setSaveSuccess("Address record saved! Transaction submitted.");
      setTimeout(() => {
        setShowAddressesModal(false);
        setSaveSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error("Error saving address:", err);
      setSaveError(err.message || "Failed to save address record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyAddress = () => {
    // Verify by checking if address matches connected wallet
    if (polygonAddress.toLowerCase() === address?.toLowerCase()) {
      setSaveSuccess("Address matches connected wallet ✓");
    } else {
      setSaveError("Address does not match connected wallet");
    }
  };

  const handleOtherRecordChange = (field: string, value: string) => {
    setOtherRecords((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveOtherRecords = async () => {
    if (!selectedDomain?.name) {
      setSaveError("No domain selected");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const recordsToSave = [
        { key: "contentHash", value: otherRecords.ipfs },
        { key: "arweave", value: otherRecords.arwv },
        { key: "ipns", value: otherRecords.ipns },
        { key: "dns.A", value: otherRecords.dnsA },
        { key: "dns.AAAA", value: otherRecords.dnsAAAA },
        { key: "dns.CNAME", value: otherRecords.dnsCNAME },
        { key: "dns.TXT", value: otherRecords.dnsTXT },
      ].filter((r) => r.value);

      for (const record of recordsToSave) {
        await setTextRecord(selectedDomain.name, record.key, record.value);
      }

      setSaveSuccess("Records saved successfully! Transaction(s) submitted.");
      setTimeout(() => {
        setShowOtherRecordsModal(false);
        setSaveSuccess(null);
      }, 2000);
    } catch (err: any) {
      console.error("Error saving other records:", err);
      setSaveError(err.message || "Failed to save records");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!transferConfirmed) {
      setSaveError("Please confirm that you understand the risks");
      return;
    }

    if (!transferAddress || !selectedDomain?.name) {
      setSaveError("Please enter a valid address");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      await transferDomain(selectedDomain.name, transferAddress);
      setSaveSuccess("Transfer initiated! Please confirm in your wallet.");
      setTimeout(() => {
        setShowTransferModal(false);
        setSaveSuccess(null);
        // Reload domains after transfer
        if (address) {
          getUserDomains(address).then(setUserDomains);
        }
      }, 2000);
    } catch (err: any) {
      console.error("Error transferring domain:", err);
      setSaveError(err.message || "Failed to transfer domain");
    } finally {
      setIsSaving(false);
    }
  };

  // Build sidebar items dynamically based on loaded records
  const sidebarItems = [
    {
      title: "Socials",
      small: "Edit",
      isEditable: true,
      content: (
        <div className="flex gap-3">
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.website
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="Website"
          >
            <img
              src={internetIcon}
              alt="Website"
              className="w-5 h-5 opacity-70"
            />
          </div>
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.twitter
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="Twitter"
          >
            <img
              src={twitterIcon}
              alt="Twitter"
              className="w-5 h-5 opacity-70"
            />
          </div>
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.discord
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="Discord"
          >
            <img
              src={discordIcon}
              alt="Discord"
              className="w-5 h-5 opacity-70"
            />
          </div>
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.telegram
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="Telegram"
          >
            <img
              src={telegramIcon}
              alt="Telegram"
              className="w-5 h-5 opacity-70"
            />
          </div>
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.github
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="GitHub"
          >
            <img src={githubIcon} alt="GitHub" className="w-5 h-5 opacity-70" />
          </div>
          <div
            className={`w-10 h-10 rounded-md  ${
              socials.email
                ? "border-blue-500 bg-blue-500/10"
                : "border-[rgba(255,255,255,0.06)]"
            } flex items-center justify-center text-lg transition-all`}
            title="Email"
          >
            <img src={emailIcon} alt="GitHub" className="w-5 h-5 opacity-70" />
          </div>
        </div>
      ),
    },
    {
      title: "Addresses",
      small: "Manage",
      isEditable: true,
      content: (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#8247E5] via-[#7B3FE4] to-[#6A3CD8] flex items-center justify-center text-white font-bold">
            P
          </div>
          <div>
            <div className="text-sm">Polymarket (Deposit Address)</div>
            <div className="text-xs text-[var(--text-soft)]">
              {polygonAddress
                ? `${polygonAddress.slice(0, 6)}...${polygonAddress.slice(-4)}`
                : "Not set"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Ownership",
      small: "Transfer",
      isEditable: true,
      content: (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
            👤
          </div>
          <div>
            <div className="text-sm">Owner</div>
            <div className="text-xs text-[var(--text-soft)]">
              {address
                ? `${address.slice(0, 6)}...${address.slice(-4)}`
                : "Not connected"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Other records",
      small: "Configure",
      isEditable: true,
      content: <div className="text-sm">DNS and Decentralized storage</div>,
    },
  ];

  if (!address) {
    return (
      <div
        className="min-h-screen w-full px-8 py-6 text-[var(--text-light)]"
        style={{ background: "var(--primary-gradient)" }}
      >
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-[var(--text-soft)]">
              Please connect your wallet to view your domain profile
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (userDomains.length === 0) {
    return (
      <div
        className="min-h-screen w-full px-8 py-6 text-[var(--text-light)]"
        style={{ background: "var(--primary-gradient)" }}
      >
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">No Domains Found</h2>
            <p className="text-[var(--text-soft)] mb-6">
              You don't own any domains yet
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-[var(--primary)] rounded-md hover:opacity-90 transition"
            >
              Register a Domain
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen w-full px-8 py-6 text-[var(--text-light)]"
      initial="initial"
      animate="animate"
      variants={{
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.5 } },
      }}
      style={{ background: "var(--primary-gradient)" }}
    >
      <Navbar />
      {/* Header */}
      <motion.header className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">

            <div className="flex items-center gap-4 px-4 py-3 rounded border border-[rgba(255,255,255,0.06)]">
              <div className="w-14 h-14 bg-[#2E56FF] rounded-md flex items-center justify-center text-2xl font-bold">
                {selectedDomain?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {selectedDomain?.name || "Loading..."}
                </div>
                <div className="text-sm text-[var(--text-soft)] flex items-center gap-2">
                  Owned By: {address?.slice(0, 8)}...{address?.slice(-4)}
                  <a
                    href={`https://polygonscan.com/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition"
                  >
                    ⧉
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 bg-[var(--primary)] rounded-md hover:opacity-90 transition"
            >
              List Domain
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="px-4 py-2 border border-[rgba(255,255,255,0.14)] rounded-md hover:border-[rgba(255,255,255,0.3)] transition"
            >
              Set as Primary
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              className="w-11 h-11 rounded border border-[rgba(255,255,255,0.12)] flex items-center justify-center hover:border-[rgba(255,255,255,0.3)] transition"
              title="Share"
            >
              ⤴
            </motion.button>
          </div>
        </div>
      </motion.header>

      <motion.main
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={container}
      >
        {/* Left sidebar (spans 1 col) */}
        <section className="col-span-1 space-y-4 md:space-y-5">
          {sidebarItems.map((s) => (
            <motion.div
              key={s.title}
              className="p-3 md:p-4 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.12)] transition-all"
            >
              <div className="flex justify-between items-center mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="text-lg md:text-xl">◎</div>
                  <div className="text-sm md:text-base font-medium">{s.title}</div>
                </div>
                <button
                  onClick={() => {
                    if (!s.isEditable) return;
                    setSaveError(null);
                    setSaveSuccess(null);
                    if (s.title === "Socials") setShowSocialsModal(true);
                    else if (s.title === "Addresses")
                      setShowAddressesModal(true);
                    else if (s.title === "Other records")
                      setShowOtherRecordsModal(true);
                    else if (s.title === "Ownership")
                      setShowTransferModal(true);
                  }}
                  className={`text-xs md:text-sm ${
                    s.isEditable
                      ? "text-[#2349E2] hover:underline cursor-pointer"
                      : "text-[var(--text-soft)]"
                  }`}
                >
                  {s.small}
                </button>
              </div>
              <div>{s.content}</div>
            </motion.div>
          ))}
        </section>

        {/* Right panel - takes 2 cols */}
        <section className="col-span-1 lg:col-span-2">
          <motion.div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4 md:p-6 bg-[rgba(255,255,255,0.02)]">
            {/* Tabs */}
            <div className="flex items-end gap-4 md:gap-6 border-b border-[rgba(255,255,255,0.03)] pb-2 md:pb-3 mb-4 md:mb-6 overflow-x-auto">
              {rightTabs.map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  whileTap={{ scale: 0.98 }}
                  className={`pb-2 text-xs md:text-sm whitespace-nowrap ${
                    activeTab === t
                      ? "border-b-2 border-[var(--primary)]"
                      : "opacity-70"
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            {/* Content area */}
            <motion.div variants={scaleIn}>
              {/* Domain Wrapper row */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="text-base md:text-lg font-semibold">Domain Wrapper</div>
                  <div className="text-xs md:text-sm text-[var(--text-soft)] max-w-prose mt-1">
                    Wrapped NFT domains can receive funds and be viewed in
                    wallets and marketplaces. However, some standard domain
                    features will be disabled.
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    className="w-full md:w-auto px-4 py-2 bg-[var(--primary)] text-sm md:text-base rounded-md hover:opacity-90 transition"
                  >
                    Wrap to NFT
                  </motion.button>
                </div>
              </div>

              {/* Domain's Background Setting */}
              <div className="mb-6">
                <div className="text-xl md:text-2xl font-semibold mb-4">
                  Domain's Background Setting
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Preview card */}
                  <motion.div
                    className="w-full md:w-64 h-64 mx-auto md:mx-0 rounded-md border border-[rgba(255,255,255,0.06)] overflow-hidden  flex items-center justify-center relative"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="absolute inset-0 nft-bg"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-medium z-10">
                      {selectedDomain?.name+'.poly' || "domain.poly"}
                    </div>
                  </motion.div>

                  {/* Description */}
                  <div className="md:col-span-2 text-sm md:text-base text-[var(--text-soft)]">
                    Limited edition backgrounds are jointly issued by PNS and
                    other partners. The issuance activities are launched from
                    time to time.
                  </div>
                </div>
              </div>

              {/* filler: activity / advanced content previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div
                  className="p-4 rounded border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] transition-all"
                  whileHover={{ y: -4 }}
                >
                  <div className="text-base md:text-lg font-semibold mb-2">
                    Records & Metadata
                  </div>
                  <div className="text-xs md:text-sm text-[var(--text-soft)]">
                    DNS entries, IPFS links, and other decentralized storage
                    records.
                  </div>
                </motion.div>

                <motion.div
                  className="p-4 rounded border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.12)] transition-all"
                  whileHover={{ y: -4 }}
                >
                  <div className="text-base md:text-lg font-semibold mb-2">
                    Recent Activity
                  </div>
                  <div className="text-xs md:text-sm text-[var(--text-soft)]">
                    Last transfer • Wrapped • Price updates
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </motion.main>

      {/* Edit Socials Modal */}
      <AnimatePresence>
        {showSocialsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowSocialsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0f2e] border border-blue-700 rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Edit Socials
                </h2>
                <button
                  onClick={() => setShowSocialsModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <img src={internetIcon} alt="Website" className="w-4 h-4" />
                    Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://"
                    value={socials.website}
                    onChange={(e) =>
                      handleSocialChange("website", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <img src={twitterIcon} alt="Twitter" className="w-4 h-4" />
                    Twitter
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.twitter}
                    onChange={(e) =>
                      handleSocialChange("twitter", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>

                {/* Telegram */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <img
                      src={telegramIcon}
                      alt="Telegram"
                      className="w-4 h-4"
                    />
                    Telegram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.telegram}
                    onChange={(e) =>
                      handleSocialChange("telegram", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <img src={discordIcon} alt="Discord" className="w-4 h-4" />
                    Discord
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.discord}
                    onChange={(e) =>
                      handleSocialChange("discord", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email"
                    value={socials.email}
                    onChange={(e) =>
                      handleSocialChange("email", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>

                {/* GitHub */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <img src={githubIcon} alt="GitHub" className="w-4 h-4" />
                    GitHub
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.github}
                    onChange={(e) =>
                      handleSocialChange("github", e.target.value)
                    }
                    className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {saveError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                  {saveSuccess}
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveSocials}
                disabled={isSaving}
                className="w-full mt-6 bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Addresses Modal */}
      <AnimatePresence>
        {showAddressesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowAddressesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0f2e] border border-blue-700 rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Manage Addresses
                </h2>
                <button
                  onClick={() => setShowAddressesModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Polygon Address Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Polymarket Address (Fund receiving address)
                </h3>
                <p className="text-sm text-[var(--text-soft)] mb-4">
                  This alternative address will receive funds sent to your
                  domain, and can differ from the address holding your domain.
                  It is commonly used to direct funds to a hot wallet, while
                  your domain remains in a cold wallet.
                </p>

                {/* Status Messages */}
                {saveError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                    {saveError}
                  </div>
                )}
                {saveSuccess && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                    {saveSuccess}
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Input a new Polymarket Address"
                    value={polygonAddress}
                    onChange={(e) => setPolygonAddress(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                  <button
                    onClick={handleSaveAddress}
                    disabled={isSaving}
                    className="bg-[#2349E2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition whitespace-nowrap disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleVerifyAddress}
                    className="border border-[#2349E2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2349E2]/10 transition whitespace-nowrap"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Add Other Addresses Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Add Other Addresses
                </h3>
                <p className="text-sm text-[var(--text-soft)] mb-4">
                  Add addresses from across chains to build a complete web3
                  profile
                </p>

                <div className="flex flex-wrap gap-3">
                  {/* SOL */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#00D1FF] to-[#7B61FF] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ≡
                    </div>
                    <span className="text-white font-medium">SOL</span>
                  </button>

                  {/* ETH */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#627EEA] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ⟠
                    </div>
                    <span className="text-white font-medium">ETH</span>
                  </button>

                  {/* BASE */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#0052FF] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ⬡
                    </div>
                    <span className="text-white font-medium">BASE</span>
                  </button>

                  {/* LTC */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#345D9D] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      Ł
                    </div>
                    <span className="text-white font-medium">LTC</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other Records Modal */}
      <AnimatePresence>
        {showOtherRecordsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowOtherRecordsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0f2e] border border-blue-700 rounded-xl p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Other Records
                </h2>
                <button
                  onClick={() => setShowOtherRecordsModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Decentralized Storage Records Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Decentralized Storage Records
                </h3>

                <div className="space-y-4">
                  {/* IPFS */}
                  <div>
                    <label className="block text-sm text-white mb-2">
                      IPFS
                    </label>
                    <input
                      type="text"
                      placeholder="Enter IPFS Content Identifier (CID)"
                      value={otherRecords.ipfs}
                      onChange={(e) =>
                        handleOtherRecordChange("ipfs", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>

                  {/* ARWV */}
                  <div>
                    <label className="block text-sm text-white mb-2">
                      ARWV
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Arweave Transaction ID"
                      value={otherRecords.arwv}
                      onChange={(e) =>
                        handleOtherRecordChange("arwv", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>

                  {/* IPNS */}
                  <div>
                    <label className="block text-sm text-white mb-2">
                      IPNS
                    </label>
                    <input
                      type="text"
                      placeholder="Enter IPNS identifier"
                      value={otherRecords.ipns}
                      onChange={(e) =>
                        handleOtherRecordChange("ipns", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>
                </div>
              </div>

              {/* DNS Records Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  DNS Records
                </h3>

                <div className="space-y-4">
                  {/* A Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">A</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">
                      Point domain to an IPv4 address
                    </p>
                    <input
                      type="text"
                      placeholder="E.g. 111.108.1.1"
                      value={otherRecords.dnsA}
                      onChange={(e) =>
                        handleOtherRecordChange("dnsA", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>

                  {/* AAAA Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">
                      AAAA
                    </label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">
                      Point domain to an IPv6 address
                    </p>
                    <input
                      type="text"
                      placeholder="E.g. 2001:0db8:76a2:0000:0000:8a2e:3970:7334"
                      value={otherRecords.dnsAAAA}
                      onChange={(e) =>
                        handleOtherRecordChange("dnsAAAA", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>

                  {/* CNAME Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">
                      CNAME
                    </label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">
                      Point this domain to traditional domain
                    </p>
                    <input
                      type="text"
                      placeholder="E.g. example.com"
                      value={otherRecords.dnsCNAME}
                      onChange={(e) =>
                        handleOtherRecordChange("dnsCNAME", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>

                  {/* TXT Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">TXT</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">
                      Store text data for verification or metadata
                    </p>
                    <input
                      type="text"
                      placeholder="Enter TXT value here"
                      value={otherRecords.dnsTXT}
                      onChange={(e) =>
                        handleOtherRecordChange("dnsTXT", e.target.value)
                      }
                      className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {saveError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                  {saveSuccess}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleSaveOtherRecords}
                disabled={isSaving}
                className="w-full bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Confirm"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Domain Modal */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowTransferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0a0f2e] border border-blue-700 rounded-xl p-6 w-full max-w-lg my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Transfer Domain
                </h2>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Domain to be transferred */}
              <div className="mb-6">
                <label className="block text-sm text-white mb-2">
                  Domain to be transferred
                </label>
                <div className="bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3">
                  <span className="text-white">
                    {selectedDomain?.name || "domain.poly"}
                  </span>
                </div>
              </div>

              {/* New owner's wallet address */}
              <div className="mb-6">
                <label className="block text-sm text-white mb-2">
                  New owner's wallet address (or domain)
                </label>
                <input
                  type="text"
                  placeholder="Enter wallet address or domain"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                />
              </div>

              {/* Confirmation checkbox */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferConfirmed}
                    onChange={(e) => setTransferConfirmed(e.target.checked)}
                    className="mt-1 w-4 h-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.2)] rounded accent-[#2349E2]"
                  />
                  <span className="text-sm text-[var(--text-soft)]">
                    I understand that sending to an incorrect address cannot be
                    reversed
                  </span>
                </label>
              </div>

              {/* Status Messages */}
              {saveError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm">
                  {saveSuccess}
                </div>
              )}

              {/* Confirm Button */}
              <button
                onClick={handleConfirmTransfer}
                className="w-full bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!transferConfirmed || !transferAddress || isSaving}
              >
                {isSaving ? "Transferring..." : "Confirm"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
