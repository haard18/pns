// DomainProfile.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Uses the uploaded image at:
 * /mnt/data/b8af53d4-b285-4c75-84ea-bc37be220d62.png
 *
 * Keep your :root CSS vars (--primary-gradient, --text-light, etc.) in App.css
 */

const sidebarItems = [
  {
    title: "Socials",
    small: "Edit",
    isEditable: true,
    content: (
      <div className="flex gap-3">
        {/* icon placeholders */}
        {["🌐", "✖", "🎮", "✈️", "🐱", "✉️"].map((c, i) => (
          <div
            key={i}
            className="w-10 h-10 rounded-md border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-lg"
          >
            {c}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Addresses",
    small: "Manage",
    isEditable: true,
    content: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-[#00D1FF] to-[#7B61FF] flex items-center justify-center text-white">
          S
        </div>
        <div>
          <div className="text-sm">Solana (Deposit Address)</div>
          <div className="text-xs text-[var(--text-soft)]">HAbMx...w92sz</div>
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
        <div className="w-10 h-10 rounded-sm border flex items-center justify-center">👤</div>
        <div>
          <div className="text-sm">Owner</div>
          <div className="text-xs text-[var(--text-soft)]">HAbMx...w92sz</div>
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

const rightTabs = ["Domain Settings", "Subdomains", "Advanced", "Activity"];

const container = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08, when: "beforeChildren" },
  },
};

const item = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.45 } },
};

export default function DomainProfile() {
  const [activeTab, setActiveTab] = useState("Domain Settings");
  const [showSocialsModal, setShowSocialsModal] = useState(false);
  const [showAddressesModal, setShowAddressesModal] = useState(false);
  const [showOtherRecordsModal, setShowOtherRecordsModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [socials, setSocials] = useState({
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
    email: "",
    github: "",
  });
  const [solanaAddress, setSolanaAddress] = useState("");
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
    setSocials(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSocials = () => {
    // Save logic here
    setShowSocialsModal(false);
  };

  const handleSaveAddress = () => {
    // Save address logic here
    setShowAddressesModal(false);
  };

  const handleVerifyAddress = () => {
    // Verify address logic here
    console.log("Verifying address:", solanaAddress);
  };

  const handleOtherRecordChange = (field: string, value: string) => {
    setOtherRecords(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveOtherRecords = () => {
    // Save other records logic here
    setShowOtherRecordsModal(false);
  };

  const handleSaveTransferAddress = () => {
    // Save transfer address logic here
    console.log("Saving transfer address:", transferAddress);
  };

  const handleConfirmTransfer = () => {
    if (!transferConfirmed) {
      alert("Please confirm that you understand the risks");
      return;
    }
    // Transfer domain logic here
    console.log("Transferring domain to:", transferAddress);
    setShowTransferModal(false);
  };

  return (
    <motion.div
      className="min-h-screen w-full px-8 py-6 text-[var(--text-light)]"
      initial="initial"
      animate="animate"
      variants={{ initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.5 } } }}
      style={{ background: "var(--primary-gradient)" }}
    >
      {/* Header */}
      <motion.header className="mb-6" >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button className="text-2xl font-medium">◀ Back</button>
            <div className="flex items-center gap-4 px-4 py-3 rounded border border-[rgba(255,255,255,0.06)]">
              <div className="w-14 h-14 bg-[#2E56FF] rounded-md flex items-center justify-center text-2xl font-bold">A</div>
              <div>
                <div className="text-2xl font-semibold">alex.poly</div>
                <div className="text-sm text-[var(--text-soft)]">Owned By: HAbMx...w92sz ⧉</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.03 }} className="px-4 py-2 bg-[var(--primary)] rounded-md">
              List Domain
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} className="px-4 py-2 border border-[rgba(255,255,255,0.14)] rounded-md">
              Set as Primary
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} className="w-11 h-11 rounded border border-[rgba(255,255,255,0.12)] flex items-center justify-center">
              ⤴
            </motion.button>
          </div>
        </div>
      </motion.header>

      <motion.main className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={container}>
        {/* Left sidebar (spans 1 col) */}
        <section className="col-span-1 space-y-5">
          {sidebarItems.map((s, idx) => (
            <motion.div
              key={s.title}
              className="p-4 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-xl">◎</div>
                  <div className="font-medium">{s.title}</div>
                </div>
                <button
                  onClick={() => {
                    if (!s.isEditable) return;
                    if (s.title === "Socials") setShowSocialsModal(true);
                    else if (s.title === "Addresses") setShowAddressesModal(true);
                    else if (s.title === "Other records") setShowOtherRecordsModal(true);
                    else if (s.title === "Ownership") setShowTransferModal(true);
                  }}
                  className={`text-sm ${s.isEditable ? 'text-[#2349E2] hover:underline cursor-pointer' : 'text-[var(--text-soft)]'}`}
                >
                  {s.small}
                </button>
              </div>
              <div>{s.content}</div>
            </motion.div>
          ))}
        </section>

        {/* Right panel - takes 2 cols */}
        <section className="col-span-2">
          <motion.div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-6 bg-[rgba(255,255,255,0.02)]" >
            {/* Tabs */}
            <div className="flex items-end gap-6 border-b border-[rgba(255,255,255,0.03)] pb-3 mb-6">
              {rightTabs.map((t) => (
                <motion.button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  whileTap={{ scale: 0.98 }}
                  className={`pb-2 text-sm ${activeTab === t ? "border-b-2 border-[var(--primary)]" : "opacity-70"}`}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            {/* Content area */}
            <motion.div variants={scaleIn}>
              {/* Domain Wrapper row */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-lg font-semibold">Domain Wrapper</div>
                  <div className="text-sm text-[var(--text-soft)] max-w-prose">
                    Wrapped NFT domains can receive funds and be viewed in wallets and marketplaces. However, some standard domain features will be disabled.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button whileHover={{ scale: 1.03 }} className="px-4 py-2 bg-[var(--primary)] rounded-md">
                    Wrap to NFT
                  </motion.button>
                </div>
              </div>

              {/* Domain's Background Setting */}
              <div className="mb-6">
                <div className="text-2xl font-semibold mb-4">Domain's Background Setting</div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {/* Preview card */}
                  <motion.div
                    className="w-64 h-64 rounded-md border border-[rgba(255,255,255,0.06)] overflow-hidden bg-gradient-to-b from-[#0b1b6b] to-[#08103a] flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* image preview using uploaded file path */}
                    <img
                      src="/mnt/data/b8af53d4-b285-4c75-84ea-bc37be220d62.png"
                      alt="domain-bg-preview"
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute pointer-events-none inset-0 flex items-center justify-center text-white text-xl font-medium">alex.poly</div>
                  </motion.div>

                  {/* Description */}
                  <div className="md:col-span-2 text-[var(--text-soft)]">
                    Limited edition backgrounds are jointly issued by PNS and other partners. The issuance activities are launched from time to time.
                  </div>
                </div>
              </div>

              {/* filler: activity / advanced content previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div className="p-4 rounded border border-[rgba(255,255,255,0.04)]" whileHover={{ y: -4 }}>
                  <div className="text-lg font-semibold mb-2">Records & Metadata</div>
                  <div className="text-sm text-[var(--text-soft)]">DNS entries, IPFS links, and other decentralized storage records.</div>
                </motion.div>

                <motion.div className="p-4 rounded border border-[rgba(255,255,255,0.04)]" whileHover={{ y: -4 }}>
                  <div className="text-lg font-semibold mb-2">Recent Activity</div>
                  <div className="text-sm text-[var(--text-soft)]">Last transfer • Wrapped • Price updates</div>
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
              className="bg-[#0a0f2e] border border-blue-700 p-6 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Edit Socials</h2>
                <button
                  onClick={() => setShowSocialsModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Website */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
                      <path d="M10 2C7.243 2 5 4.243 5 7h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.654-1.346 3-3 3v2c2.757 0 5-2.243 5-5s-2.243-5-5-5z" />
                    </svg>
                    Website
                  </label>
                  <input
                    type="text"
                    placeholder="https://"
                    value={socials.website}
                    onChange={(e) => handleSocialChange('website', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                    Twitter
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                  />
                </div>

                {/* Telegram */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                    </svg>
                    Telegram
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.telegram}
                    onChange={(e) => handleSocialChange('telegram', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                  />
                </div>

                {/* Discord */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Discord
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.discord}
                    onChange={(e) => handleSocialChange('discord', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email"
                    value={socials.email}
                    onChange={(e) => handleSocialChange('email', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                  />
                </div>

                {/* GitHub */}
                <div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-soft)] mb-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={socials.github}
                    onChange={(e) => handleSocialChange('github', e.target.value)}
                    className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                  />
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSocials}
                className="w-full mt-6 bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition"
              >
                Save
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
                <h2 className="text-xl font-semibold text-white">Manage Addresses</h2>
                <button
                  onClick={() => setShowAddressesModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Solana Address Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-2">Solana Address (Fund receiving address)</h3>
                <p className="text-sm text-[var(--text-soft)] mb-4">
                  This alternative address will receive funds sent to your domain, and can differ from the address holding your domain. It is commonly used to direct funds to a hot wallet, while your domain remains in a cold wallet.
                </p>

                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Input a new Solana Address"
                    value={solanaAddress}
                    onChange={(e) => setSolanaAddress(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                  <button
                    onClick={handleSaveAddress}
                    className="bg-[#2349E2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition whitespace-nowrap"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleVerifyAddress}
                    className="bg-[#2349E2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition whitespace-nowrap"
                  >
                    Verify
                  </button>
                </div>
              </div>

              {/* Add Other Addresses Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Add Other Addresses</h3>
                <p className="text-sm text-[var(--text-soft)] mb-4">
                  Add addresses from across chains to build a complete web3 profile
                </p>

                <div className="flex flex-wrap gap-3">
                  {/* BTC */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#F7931A] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ₿
                    </div>
                    <span className="text-white font-medium">BTC</span>
                  </button>

                  {/* ETH */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#627EEA] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      ⟠
                    </div>
                    <span className="text-white font-medium">ETH</span>
                  </button>

                  {/* INJ */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-gradient-to-r from-[#00F2FE] to-[#4FACFE] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      I
                    </div>
                    <span className="text-white font-medium">INJ</span>
                  </button>

                  {/* BASE */}
                  <button className="flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,255,255,0.2)] rounded-lg px-4 py-3 hover:border-[#2349E2] transition group">
                    <div className="w-6 h-6 bg-[#0052FF] rounded-full flex items-center justify-center text-white text-xs font-bold">
                      B
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
                <h2 className="text-xl font-semibold text-white">Other Records</h2>
                <button
                  onClick={() => setShowOtherRecordsModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Decentralized Storage Records Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Decentralized Storage Records</h3>

                <div className="space-y-4">
                  {/* IPFS */}
                  <div>
                    <label className="block text-sm text-white mb-2">IPFS</label>
                    <input
                      type="text"
                      placeholder="Enter IPFS Content Identifier(CID)"
                      value={otherRecords.ipfs}
                      onChange={(e) => handleOtherRecordChange('ipfs', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* ARWV */}
                  <div>
                    <label className="block text-sm text-white mb-2">ARWV</label>
                    <input
                      type="text"
                      placeholder="Enter Arweave Transaction ID"
                      value={otherRecords.arwv}
                      onChange={(e) => handleOtherRecordChange('arwv', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* SHDW */}
                  <div>
                    <label className="block text-sm text-white mb-2">SHDW</label>
                    <input
                      type="text"
                      placeholder="Enter Arweave Transaction ID"
                      value={otherRecords.shdw}
                      onChange={(e) => handleOtherRecordChange('shdw', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* IPNS */}
                  <div>
                    <label className="block text-sm text-white mb-2">IPNS</label>
                    <input
                      type="text"
                      placeholder="Enter IPNS identifier"
                      value={otherRecords.ipns}
                      onChange={(e) => handleOtherRecordChange('ipns', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>
                </div>
              </div>

              {/* DNS Records Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">DNS Records</h3>

                <div className="space-y-4">
                  {/* A Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">A</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">Point domain to an IPv4 address</p>
                    <input
                      type="text"
                      placeholder="E.g. 111.108.1.1"
                      value={otherRecords.dnsA}
                      onChange={(e) => handleOtherRecordChange('dnsA', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* AAAA Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">AAAA</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">Point domain to an IPv6 address</p>
                    <input
                      type="text"
                      placeholder="E.g. 2001:0db8:76a2:0000:0000:8a2e:3970:7334"
                      value={otherRecords.dnsAAAA}
                      onChange={(e) => handleOtherRecordChange('dnsAAAA', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* CNAME Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">CNAME</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">Point this domain to tradtition domain</p>
                    <input
                      type="text"
                      placeholder="E.g. example.com"
                      value={otherRecords.dnsCNAME}
                      onChange={(e) => handleOtherRecordChange('dnsCNAME', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>

                  {/* TXT Record */}
                  <div>
                    <label className="block text-sm text-white mb-1">TXT</label>
                    <p className="text-xs text-[var(--text-soft)] mb-2">Store text data for verification or metadata</p>
                    <input
                      type="text"
                      placeholder="Enter TXT value here"
                      value={otherRecords.dnsTXT}
                      onChange={(e) => handleOtherRecordChange('dnsTXT', e.target.value)}
                      className="w-full bg-[rgba(255,255,255,0.03)] border rounded-none border-blue-700 rounded-lg px-4 py-2 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-blue-700 transition"

                    />
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleSaveOtherRecords}
                className="w-full bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition"
              >
                Confirm
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
                <h2 className="text-xl font-semibold text-white">Transfer Domain</h2>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="text-[var(--text-soft)] hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Domain to be transferred */}
              <div className="mb-6">
                <label className="block text-sm text-white mb-2">Domain to be transferred</label>
                <div className="bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3">
                  <span className="text-white">alex.poly</span>
                </div>
              </div>

              {/* New owner's wallet address */}
              <div className="mb-6">
                <label className="block text-sm text-white mb-2">New owner's wallet address (or domain)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter wallet address or domain"
                    value={transferAddress}
                    onChange={(e) => setTransferAddress(e.target.value)}
                    className="flex-1 bg-[rgba(255,255,255,0.03)] border border-blue-700 rounded-lg px-4 py-3 text-white placeholder-[var(--text-soft)] focus:outline-none focus:border-[#2349E2] transition"
                  />
                  <button
                    onClick={handleSaveTransferAddress}
                    className="bg-[#2349E2] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition whitespace-nowrap"
                  >
                    Save
                  </button>
                </div>
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
                    I understand that sending to an incorrect address cannot be reversed
                  </span>
                </label>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmTransfer}
                className="w-full bg-[#2349E2] text-white py-3 rounded-lg font-medium hover:bg-[#1e3dc7] transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!transferConfirmed || !transferAddress}
              >
                Confirm
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
