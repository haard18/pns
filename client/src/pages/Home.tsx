// @ts-nocheck
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../App.css";
import bars from "../assets/bars.png";
import { left1, right1, right2, left2 } from "../assets/features/index";
import { cube, graph, line } from "../assets/Community/index";
import logo from "../assets/Logo.png";
import connect from "../assets/Connect.svg";
import { x, tg, discord } from "../assets/footer";
import AutoCarousel from "../components/Carousel";

// Animation variants
export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const Home = () => {
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchInput)}`);
    }
  };
  return (
    <>
      {/* HERO SECTION */}
      <div
        className="relative min-h-screen overflow-hidden"
        style={{ background: "var(--primary-gradient)" }}
      >
        <Navbar />

        {/* Hero */}
        <motion.div
          className="flex flex-col items-center text-center mt-32 md:mt-40 lg:mt-50 px-4 pb-20 md:pb-40"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.h1
            className="text-3xl md:text-3xl lg:text-4xl text-(--text-light) max-w-4xl leading-tight"
            variants={fadeInUp}
          >
            Your Polymarket Identity - Simplified{" "}
          </motion.h1>

          <motion.p
            className="text-base text-sm md:text-md text-(--text-soft) mt-4 max-w-3xl"
            variants={fadeInUp}
          >
            Complete control of your Identity on Polymarket and web3 environment
            at large - Simplify your identity and trading experience on
            predictify with a simple .poly domain
          </motion.p>

          {/* Search bar */}
          <motion.div
            className="mt-8 w-full max-w-xl flex items-center bg-black backdrop-blur-md border border-white/20 overflow-hidden"
            variants={scaleIn}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search your .poly domain Now"
              className="flex-1 px-4 py-3 bg-transparent text-white placeholder-white placeholder-opacity-100 outline-none min-w-0"
            />

            <div className="relative inline-block m-4">
              {/* Glow */}
              <div
                className="absolute inset-0 blur-xl opacity-20"
                style={{
                  background:
                    'radial-gradient(circle, #2349E2 0%, transparent 70%)',
                }}
              ></div>

              <motion.button
                onClick={handleSearch}
                className="relative px-6 py-3 border border-[#2349E2] transition text-white font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Search
              </motion.button>
            </div>
          </motion.div>

        </motion.div>

        {/* Bars image at the bottom */}
        <img
          src={bars}
          alt="section divider"
          className="absolute bottom-0 left-0 w-full opacity-60 pointer-events-none select-none"
        />
      </div>

      <section
        className="py-24 px-6"
        style={{ background: "var(--accent-soft)" }}
      >
        <motion.div
          className="max-w-6xl mx-auto text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.p
            className="text-lg tracking-widest text-(--primary-color) mb-3"
            style={{ color: "#436BFF" }}
          >
            [ FEATURES ]
          </motion.p>

          <motion.h2
            className="text-4xl text-black font-semibold mb-4"
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            What You Can Do?
          </motion.h2>

          <motion.p
            className="text-(--text-soft) max-w-2xl mx-auto"
            style={{ color: "black" }}
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            Discover how your .poly domain empowers you to own, connect, and
            grow your identity across the Predictify ecosystem.
          </motion.p>
        </motion.div>

        {/* Real Masonry Grid */}
        {/* Real Masonry Grid */}
        {/* Masonry Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* 1 — Own your name (RECTANGLE NOW) */}
            <motion.div
              className="bg-[#EDEBFF] border-2 border-[#C8C5F3] p-8 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
            >
              <img
                src={left1}
                alt="Own Your Name"
                className="w-full h-52 object-contain mb-6"
              />

              <h3 className="text-xl text-black font-semibold mb-2">Own your name</h3>
              <p className="text-[#39394A] text-sm leading-relaxed">
                Your .poly domain is more than just a name — it's completely yours and
                verifiable on the blockchain.
              </p>
            </motion.div>

            {/* 2 — Share with ease (SQUARE NOW) */}
            <motion.div
              className="bg-[#EDEBFF] border-2 border-[#C8C5F3] p-8 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
            >
              <img
                src={left2}
                alt="Share with ease"
                className="w-full h-44 object-contain mb-6"
              />

              <h3 className="text-xl text-black font-semibold mb-2">Share with ease</h3>
              <p className="text-[#39394A] text-sm leading-relaxed">
                Send and receive predictions, data, or rewards directly through
                yourname.poly.
              </p>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">

            {/* 3 — Unify your identity (SQUARE NOW) */}
            <motion.div
              className="bg-[#EDEBFF] border-2 border-[#C8C5F3] p-8 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
            >
              <img
                src={right1}
                alt="Unify your identity"
                className="w-full h-44 object-contain mb-6"
              />

              <h3 className="text-xl text-black font-semibold mb-2">
                Unify your identity
              </h3>
              <p className="text-[#39394A] text-sm leading-relaxed">
                Link all your existing wallets including polymarket address to a single
                domain name.
              </p>
            </motion.div>

            {/* 4 — Build community (RECTANGLE NOW) */}
            <motion.div
              className="bg-[#EDEBFF] border-2 border-[#C8C5F3] p-8 rounded-lg flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ y: -6, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" }}
            >
              <img
                src={right2}
                alt="Build your community"
                className="w-full h-52 object-contain mb-6"
              />

              <h3 className="text-xl text-black font-semibold mb-2">
                Build Your Community with Sub-domains
              </h3>
              <p className="text-[#39394A] text-sm leading-relaxed">
                Create sub-domains for teams, projects, or collaborators — like
                teamname.poly or project.poly.
              </p>
            </motion.div>

          </div>
        </div>


      </section>
      <section
        className="py-16 md:py-24 px-4 md:px-6"
        style={{ background: "var(--primary-gradient-reverse)" }}
      >
        <motion.div
          className="max-w-7xl mx-auto mb-12 md:mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.p
            className="text-lg tracking-widest text-(--text-soft) mb-3"
            style={{ color: "var(--text-soft)" }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            [ COMMUNITY ]
          </motion.p>

          <motion.h1
            className="text-3xl md:text-4xl text-white font-semibold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join the .poly Community
          </motion.h1>

          <motion.p
            className="text-(--text-soft) max-w-3xl mb-6 text-sm md:text-base"
            style={{ color: "var(--text-soft)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Claim your name, connect your insights, and grow alongside others
            who believe in the power of open, predictive collaboration.
          </motion.p>

          <motion.p
            className="text-(--text-soft) max-w-3xl mb-10 text-sm md:text-base"
            style={{ color: "var(--text-soft)" }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Whether you're an early adopter, a developer, or a curious explorer
            — .poly connects you to a space built for innovation, creativity,
            and shared growth.
          </motion.p>

          {/* BUTTONS */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              className="px-6 py-3 border border-[#2349E2] text-white font-medium text-center"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 0 20px rgba(35, 73, 226, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Claim your .poly
            </motion.button>

            <motion.button
              className="px-6 py-3 bg-transparent border border-white/20 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 text-center"
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Join the community →
            </motion.button>
          </motion.div>
        </motion.div>

        {/* THREE HORIZONTAL CARDS */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 card">
          {/* CARD 01 */}
          <motion.div
            className="border border-[#2349E2] p-6 md:p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)",
            }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-8 md:mb-10">
              <motion.p
                className="text-sm font-bold text-(--primary)"
                style={{ color: "#436BFF" }}
                whileHover={{ scale: 1.2 }}
              >
                01
              </motion.p>

              {/* Replace with your actual image */}
              <motion.img
                src={cube}
                alt="icon"
                className="w-6 h-6 object-contain"
                whileHover={{ rotate: 15, scale: 1.2 }}
              />
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl text-white font-semibold mb-2">
              Your Identity, Your Space
            </h3>

            {/* Description */}
            <p
              className="text-(--text-soft) text-sm leading-relaxed"
              style={{ color: "var(--text-soft)" }}
            >
              Build your personalized profile around your .poly domain. Own your
              identity across Predictify — from predictions to leaderboards.
            </p>
          </motion.div>

          {/* CARD 02 */}
          <motion.div
            className="border border-[#2349E2] p-6 md:p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)",
            }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-8 md:mb-10">
              <motion.p
                className="text-sm font-bold text-(--primary)"
                style={{ color: "#436BFF" }}
                whileHover={{ scale: 1.2 }}
              >
                02
              </motion.p>

              {/* Replace with your actual image */}
              <motion.img
                src={graph}
                alt="icon"
                className="w-6 h-6 object-contain"
                whileHover={{ rotate: 15, scale: 1.2 }}
              />
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl text-white font-semibold mb-2">
              Connect & Collaborate
            </h3>

            {/* Description */}
            <p
              className="text-(--text-soft) text-sm leading-relaxed"
              style={{ color: "var(--text-soft)" }}
            >
              Join teams, DAOs, and community projects built around shared .poly
              subdomains. Collaborate seamlessly and expand your predictive
              influence.
            </p>
          </motion.div>

          <motion.div
            className="border border-[#2349E2] p-6 md:p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)",
            }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-8 md:mb-10">
              <motion.p
                className="text-sm font-bold text-(--primary)"
                style={{ color: "#436BFF" }}
                whileHover={{ scale: 1.2 }}
              >
                03
              </motion.p>

              {/* Replace with your actual image */}
              <motion.img
                src={line}
                alt="icon"
                className="w-6 h-6 object-contain"
                whileHover={{ rotate: 15, scale: 1.2 }}
              />
            </div>

            {/* Title */}
            <h3 className="text-lg md:text-xl text-white font-semibold mb-2">
              Grow with Predicitify{" "}
            </h3>

            {/* Description */}
            <p
              className="text-(--text-soft) text-sm leading-relaxed"
              style={{ color: "var(--text-soft)" }}
            >
              Earn recognition, rewards, and visibility as part of the .poly
              network.Every interaction adds to your on-chain reputation and
              predictive history.
            </p>
          </motion.div>
        </div>
      </section>
      <AutoCarousel />
      <footer className="bg-[#020215] py-12 md:py-16 px-4 md:px-6 lg:px-10">
        {/* FULL-WIDTH GRID */}
        <motion.div
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* LEFT SIDE - LOGO + SOCIALS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center md:items-start"
          >
            <motion.img
              src={logo}
              alt="Main Logo"
              className="my-3"
              whileHover={{ scale: 1.05 }}
            />

            <div className="flex items-center gap-4 mt-4">
              <motion.button
                className="flex items-center justify-center hover:bg-white/10 transition"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={discord} alt="Discord" />
              </motion.button>
              <motion.button
                className="flex items-center justify-center hover:bg-white/10 transition"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={x} alt="Twitter" />
              </motion.button>
              <motion.button
                className="flex items-center justify-center hover:bg-white/10 transition"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={tg} alt="Telegram" />
              </motion.button>
            </div>
          </motion.div>

          {/* RIGHT SIDE - 3 COLUMNS */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-10 text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* PRODUCTS */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <h3 className="text-white text-sm font-semibold mb-4">
                PRODUCTS
              </h3>
              <ul className="space-y-2 text-(--text-soft) text-sm">
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  My Domain
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Marketplace
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Subdomain Registrars
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Statistics
                </motion.li>
              </ul>
            </motion.div>

            {/* USER SUPPORT */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <h3 className="text-white text-sm font-semibold mb-4">
                USER SUPPORT
              </h3>
              <ul className="space-y-2 text-(--text-soft) text-sm">
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Blog
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Help Center
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Referral Terms & Conditions
                </motion.li>
              </ul>
            </motion.div>

            {/* LEGAL */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <h3 className="text-white text-sm font-semibold mb-4">
                LEGAL & POLICIES
              </h3>
              <ul className="space-y-2 text-(--text-soft) text-sm">
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Terms of Use
                </motion.li>
                <motion.li
                  className="hover:text-white cursor-pointer"
                  whileHover={{ x: 5 }}
                >
                  Privacy Policy
                </motion.li>
              </ul>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* COPYRIGHT */}
        <motion.div
          className="mt-12 md:mt-16 text-center text-(--text-soft) text-sm"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          ©2025 Copyright
        </motion.div>
      </footer>
    </>
  );
};

export default Home;
