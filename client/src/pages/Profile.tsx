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
                <div className="text-sm text-[var(--text-soft)]">{s.small}</div>
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
    </motion.div>
  );
}
