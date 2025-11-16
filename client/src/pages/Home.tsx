import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import "../App.css";
import bars from "../assets/bars.png";
import { left1, right1, right2, left2 } from "../assets/features/index";
import { cube, graph, line } from "../assets/Community/index";
import logo from "../assets/Logo.png";
import connect from "../assets/Connect.svg";
import { x, tg, discord } from "../assets/footer";

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const Home = () => {
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
          className="flex flex-col items-center text-center mt-50 px-4 pb-40"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-6xl text-(--text-light) max-w-3xl leading-tight"
            variants={fadeInUp}
          >
            Claim Your Web3 Identity
          </motion.h1>

          <motion.p 
            className="text-lg text-(--text-soft) mt-4 max-w-2xl"
            variants={fadeInUp}
          >
            Simplify your Predictify experience with .poly domains — your name,
            your reputation, your data identity.
          </motion.p>

          {/* Search bar */}
          <motion.div 
            className="mt-8 w-full max-w-xl flex items-center bg-black backdrop-blur-md border border-white/20 overflow-hidden"
            variants={scaleIn}
          >
            <input
              type="text"
              placeholder="Search or register a .poly domain"
              className="flex-1 px-4 py-3 bg-transparent text-(--text-light) placeholder-white/50 outline-none"
            />

            <div className="relative inline-block m-4">
              {/* Soft Glow */}
              <div
                className="absolute inset-0 blur-xl opacity-20"
                style={{
                  background:
                    "radial-gradient(circle, #2349E2 0%, transparent 70%)",
                }}
              ></div>

              {/* Button */}
              <motion.button 
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
            style={{ color: "#8D9CCF" }}
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
        {/* Masonry Grid - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* SMALL - Own your name */}
            <motion.div 
              className="bg-[#EDEBFF] border border-[#C8C5F3] p-8 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <img
                src={left1}
                alt="Own Your Name"
                className="w-full h-40 object-cover mb-6 rounded"
              />
              <div>
                <h3 className="text-xl text-black font-semibold mb-2">
                  Own your name
                </h3>
                <p className="text-(--text-dark) text-sm" style={{ color: "#39394A" }}>
                  Your .poly domain is completely yours — decentralized, secure,
                  and transferable.
                </p>
              </div>
            </motion.div>

            {/* BIG - Share with ease */}
            <motion.div 
              className="bg-[#EDEBFF] border border-[#C8C5F3]  p-8 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <img
                src={left2}
                alt="Share with ease"
                className="w-full h-56 object-contain mb-6 rounded"
              />
              <div>
                <h3 className="text-xl text-black font-semibold mb-2">
                  Share with ease
                </h3>
                <p className="text-(--text-dark) text-sm" style={{ color: "#39394A" }}>
                  Send and receive predictions, data, or rewards directly
                  through yourname.poly.
                </p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            {/* BIG - Unify identity */}
            <motion.div 
              className="bg-[#EDEBFF] border border-[#C8C5F3]  p-8 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <img
                src={right1}
                alt="Unify Identity"
                className="w-full h-56 object-contain mb-6 rounded"
              />
              <div>
                <h3 className="text-xl text-black font-semibold mb-2">
                  Unify your identity
                </h3>
                <p className="text-(--text-dark) text-sm" style={{ color: "#39394A" }}>
                  Link your wallet, predictions, stats, and profile under one
                  name.
                </p>
              </div>
            </motion.div>

            {/* SMALL - Build community */}
            <motion.div 
              className="bg-[#EDEBFF] border border-[#C8C5F3]  p-8 flex flex-col justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
            >
              <img
                src={right2}
                alt="Build your community"
                className="w-full h-40 object-contain mb-6 rounded"
              />
              <div>
                <h3 className="text-xl text-black font-semibold mb-2">
                  Build your community
                </h3>
                <p className="text-(--text-dark) text-sm" style={{ color: "#39394A" }}>
                  Create sub-domains for teams, projects, or collaborators —
                  like teamname.poly or project.poly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      <section
        className="py-24 px-6 "
        style={{ background: "var(--primary-gradient)" }}
      >
        <motion.div 
          className="max-w-7xl mx-auto  mb-16"
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
            className="text-4xl text-white font-semibold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join the .poly Community
          </motion.h1>

          <motion.p 
            className="text-(--text-soft) max-w-3xl mb-6"
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
            className="text-(--text-soft) max-w-3xl mb-10"
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
            className="flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button 
              className="px-6 py-3 border border-[#2349E2] text-white font-medium"
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(35, 73, 226, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              Claim your .poly
            </motion.button>

            <motion.button 
              className="px-6 py-3 bg-transparent border border-white/20 hover:bg-white/10 text-white font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              Join the community →
            </motion.button>
          </motion.div>
        </motion.div>

        {/* THREE HORIZONTAL CARDS */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 card">
          {/* CARD 01 */}
          <motion.div 
            className=" border border-[#2349E2] p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)" }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-10">
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
            <h3 className="text-xl text-white font-semibold mb-2">
              Your Identity, Your Space
            </h3>

            {/* Description */}
            <p className="text-(--text-soft) text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
              Build your personalized profile around your .poly domain. Own your
              identity across Predictify — from predictions to leaderboards.
            </p>
          </motion.div>

          {/* CARD 02 */}
          <motion.div 
            className=" border border-[#2349E2] p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)" }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-10">
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
            <h3 className="text-xl text-white font-semibold mb-2">
              Connect & Collaborate
            </h3>

            {/* Description */}
            <p className="text-(--text-soft) text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
              Join teams, DAOs, and community projects built around shared .poly
              subdomains. Collaborate seamlessly and expand your predictive
              influence.
            </p>
          </motion.div>

          <motion.div 
            className=" border border-[#2349E2] p-8 backdrop-blur-md hover:bg-white/10 transition text-left"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(35, 73, 226, 0.2)" }}
          >
            {/* Top row: number + image */}
            <div className="flex items-start justify-between mb-10">
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
            <h3 className="text-xl text-white font-semibold mb-2">
              Grow with Predicitify{" "}
            </h3>

            {/* Description */}
            <p className="text-(--text-soft) text-sm leading-relaxed" style={{ color: "var(--text-soft)" }}>
              Earn recognition, rewards, and visibility as part of the .poly
              network.Every interaction adds to your on-chain reputation and
              predictive history.
            </p>
          </motion.div>
        </div>
      </section>
            <section
        className="py-24 px-6"
        style={{ background: "var(--accent-soft)" }}
      >
        <motion.div 
          className="max-w-6xl p-6 border border-[#2349E2] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* LEFT TEXT BLOCK */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.p 
              className="text-lg tracking-widest text-black mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              [ CONNECT ]
            </motion.p>

            <motion.h2 
              className="text-4xl text-black font-semibold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Let's Connect.
            </motion.h2>

            <motion.p 
              className="text-black leading-relaxed max-w-md mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              This isn't just another platform — it's a growing network of
              thinkers, builders, and visionaries shaping how the world
              understands data and probability. Join us to collaborate, share
              insights, and co-create the next wave of predictive innovation
              on-chain.
            </motion.p>

            {/* CTA BUTTON */}
            <motion.button 
              className="px-6 py-3 mt-15 bg-(--primary) hover:bg-(--primary-dark) text-white font-medium"
              style={{ backgroundColor: "var(--primary)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              Join the Community →
            </motion.button>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.div 
            className="flex justify-center md:justify-end"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.img
              src={connect}
              alt="Connect illustration"
              className="md:max-w-lg object-contain"
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      </section>
      <footer className="bg-[#020215] py-16 px-10">
        {/* FULL-WIDTH GRID */}
        <motion.div 
          className="w-full mx-16 grid grid-cols-1 md:grid-cols-2 gap-16"
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
            className="grid grid-cols-2 sm:grid-cols-3 gap-10"
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
          className="mt-16 text-center text-(--text-soft) text-sm"
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
