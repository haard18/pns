import React from "react";
import "../App.css";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

const Search = () => {
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
          placeholder="Search Domains"
          className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] px-4 py-3 rounded-md outline-none"
        />

        <motion.button
          className="px-8 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition rounded-md"
        >
          Search
        </motion.button>
      </motion.div>

      {/* Layout Grid */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Left Box */}
        <motion.div variants={fadeInUp}>
          <p className="text-[var(--text-soft)] mb-3">Search results</p>

          <motion.div
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] rounded-lg p-5"
            variants={scaleIn}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">alex.poly</span>
              <span className="text-md opacity-80">20 USDC</span>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="flex-1 px-4 py-3 border border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.08)] rounded-md transition card"
              >
                Add to Cart
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition rounded-md"
              >
                Register Now
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Box */}
        <motion.div variants={fadeInUp}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-[var(--text-soft)]">Recommended alternatives</p>
            <button className="border border-[rgba(255,255,255,0.2)] px-3 py-1 rounded-md">
              Price ↕
            </button>
          </div>

          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              "allexi.poly",
              "alexai.poly",
              "alexa.poly",
              "alexim.poly",
              "alexo.poly",
            ].map((domain, i) => (
              <motion.div
                key={domain}
                className="flex justify-between items-center bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg"
                variants={scaleIn}
              >
                <span>{domain}</span>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-2 border border-[rgba(255,255,255,0.2)] rounded-md hover:bg-[rgba(255,255,255,0.08)] transition card"
                  >
                    Add
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] transition rounded-md"
                  >
                    Register
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Search;
