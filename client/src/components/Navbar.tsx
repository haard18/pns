import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/Logo.png";
import { useWallet } from "../contexts/WalletContext";

// MetaMask Fox Icon
const MetaMaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.04858 1L15.0707 10.809L12.7423 4.99098L2.04858 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28.2292 23.5334L24.7346 28.872L32.2175 30.9323L34.3611 23.6501L28.2292 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M0.658691 23.6501L2.79076 30.9323L10.2619 28.872L6.77906 23.5334L0.658691 23.6501Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.87695 14.5149L7.81885 17.6507L15.1895 17.9891L14.9364 9.97778L9.87695 14.5149Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M25.1304 14.5149L19.9945 9.88721L19.8242 17.9891L27.1832 17.6507L25.1304 14.5149Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.2619 28.872L14.7357 26.6948L10.8813 23.7012L10.2619 28.872Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.2715 26.6948L24.7345 28.872L24.1269 23.7012L20.2715 26.6948Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Phantom Ghost Icon
const PhantomIcon = () => (
  <svg width="20" height="20" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="64" cy="64" r="64" fill="url(#phantom-gradient)"/>
    <path d="M110.584 64.9142H99.142C99.142 41.7651 80.173 23 56.7724 23C33.6612 23 14.8716 41.3057 14.4118 64.0026C13.936 87.4664 33.5765 107.895 57.2906 107.895H60.6628C81.4106 107.895 110.584 87.0948 110.584 64.9142Z" fill="url(#phantom-gradient2)"/>
    <path d="M77.5296 67.442C77.5296 72.0042 74.0099 75.7026 69.6692 75.7026C65.3284 75.7026 61.8088 72.0042 61.8088 67.442C61.8088 62.8799 65.3284 59.1815 69.6692 59.1815C74.0099 59.1815 77.5296 62.8799 77.5296 67.442Z" fill="white"/>
    <path d="M51.7794 67.442C51.7794 72.0042 48.2597 75.7026 43.919 75.7026C39.5782 75.7026 36.0586 72.0042 36.0586 67.442C36.0586 62.8799 39.5782 59.1815 43.919 59.1815C48.2597 59.1815 51.7794 62.8799 51.7794 67.442Z" fill="white"/>
    <defs>
      <linearGradient id="phantom-gradient" x1="64" y1="0" x2="64" y2="128" gradientUnits="userSpaceOnUse">
        <stop stopColor="#534BB1"/>
        <stop offset="1" stopColor="#551BF9"/>
      </linearGradient>
      <linearGradient id="phantom-gradient2" x1="62.4981" y1="23" x2="62.4981" y2="107.895" gradientUnits="userSpaceOnUse">
        <stop stopColor="#534BB1"/>
        <stop offset="1" stopColor="#551BF9"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const location = useLocation();

  const wallet = useWallet();

  const isConnected = wallet.isConnected;
  const displayAddress = wallet.address || "";
  const chainLabel = wallet.providerType === 'EVM' ? 'Polygon' : wallet.providerType === 'SOL' ? 'Solana' : '';

  const handleConnectMetaMask = async () => {
    await wallet.connect('metamask')
    setShowWalletMenu(false)
  }

  const handleConnectPhantom = async () => {
    await wallet.connect('phantom')
    setShowWalletMenu(false)
  }

  const handleDisconnect = () => {
    wallet.disconnect()
    setShowWalletMenu(false)
  }

  const formatAddress = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";

  const menuVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25 } }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 mt-5 text-white">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Link to="/">
          <img src={logo} alt="PNS Logo" className="h-8 w-auto cursor-pointer hover:opacity-80 transition" />
        </Link>
      </motion.div>

      <motion.div
        className="hidden md:flex items-center gap-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link to="/search">
          <motion.span 
            whileHover={{ scale: 1.05 }} 
            className={`cursor-pointer transition ${isActive('/search') ? 'text-[#2349E2]' : 'hover:text-[#2349E2]'}`}
          >
            Search
          </motion.span>
        </Link>
        <Link to="/domains">
          <motion.span 
            whileHover={{ scale: 1.05 }} 
            className={`cursor-pointer transition ${isActive('/domains') ? 'text-[#2349E2]' : 'hover:text-[#2349E2]'}`}
          >
            My Domains
          </motion.span>
        </Link>
        <Link to="/profile">
          <motion.span 
            whileHover={{ scale: 1.05 }} 
            className={`cursor-pointer transition ${isActive('/profile') ? 'text-[#2349E2]' : 'hover:text-[#2349E2]'}`}
          >
            Profile
          </motion.span>
        </Link>

        <div className="relative">
          <motion.button
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            className="px-4 py-2 border border-[#2349E2] text-sm font-medium flex items-center gap-2 hover:bg-[#2349E2]/10 rounded-lg transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {wallet.providerType === 'EVM' ? <MetaMaskIcon /> : <PhantomIcon />}
                <span>{formatAddress(displayAddress)}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Connect Wallet
              </>
            )}
          </motion.button>

          {showWalletMenu && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              className="absolute right-0 mt-2 w-64 bg-[#0a0f2e] border border-[#2349E2] rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {isConnected ? (
                <div className="p-2">
                  <div className="px-4 py-3 border-b border-[#2349E2]/30">
                    <div className="text-xs text-gray-400 mb-1">Connected to {chainLabel}</div>
                    <div className="text-sm font-mono">{formatAddress(displayAddress)}</div>
                  </div>
                  <motion.button
                    onClick={handleDisconnect}
                    className="w-full text-left px-4 py-3 hover:bg-red-500/20 text-red-400 flex items-center gap-2 rounded-md mt-1"
                    whileHover={{ x: 4 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Disconnect
                  </motion.button>
                </div>
              ) : (
                <div className="p-2">
                  <div className="px-4 py-2 text-xs text-gray-400 border-b border-[#2349E2]/30 mb-1">
                    Select Wallet
                  </div>
                  <motion.button
                    onClick={handleConnectMetaMask}
                    className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20 flex items-center gap-3 rounded-md"
                    whileHover={{ x: 4 }}
                  >
                    <MetaMaskIcon />
                    <div>
                      <div className="font-medium">MetaMask</div>
                      <div className="text-xs text-gray-400">Polygon Network</div>
                    </div>
                  </motion.button>
                  <motion.button
                    onClick={handleConnectPhantom}
                    className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20 flex items-center gap-3 rounded-md"
                    whileHover={{ x: 4 }}
                  >
                    <PhantomIcon />
                    <div>
                      <div className="font-medium">Phantom</div>
                      <div className="text-xs text-gray-400">Solana Network</div>
                    </div>
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Mobile Menu Button */}
      <motion.button
        className="md:hidden flex flex-col gap-1.5 z-50"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
        <span className={`w-6 h-0.5 bg-white transition-all duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </motion.button>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
          className="fixed top-0 left-0 w-full h-screen bg-[#0a0f2e]/98 backdrop-blur-lg md:hidden flex flex-col gap-6 p-8 pt-24 z-40"
        >
          <Link to="/search" onClick={() => setIsMenuOpen(false)}>
            <motion.span whileHover={{ x: 8 }} className="block text-xl py-2">Search Domains</motion.span>
          </Link>
          <Link to="/domains" onClick={() => setIsMenuOpen(false)}>
            <motion.span whileHover={{ x: 8 }} className="block text-xl py-2">My Domains</motion.span>
          </Link>
          <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
            <motion.span whileHover={{ x: 8 }} className="block text-xl py-2">Profile</motion.span>
          </Link>

          <div className="pt-6 border-t border-[#2349E2]/30">
            <div className="text-sm text-gray-400 mb-4">Connect Wallet</div>
            
            {isConnected ? (
              <div>
                <div className="flex items-center gap-3 mb-4 p-3 bg-[#2349E2]/10 rounded-lg">
                  {wallet.providerType === 'EVM' ? <MetaMaskIcon /> : <PhantomIcon />}
                  <div>
                    <div className="text-sm">{formatAddress(displayAddress)}</div>
                    <div className="text-xs text-gray-400">{chainLabel}</div>
                  </div>
                </div>
                <motion.button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-3 border border-red-500/50 text-red-400 rounded-lg flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Disconnect
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                <motion.button
                  onClick={handleConnectMetaMask}
                  className="w-full px-4 py-4 border border-[#2349E2] rounded-lg flex items-center gap-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <MetaMaskIcon />
                  <div className="text-left">
                    <div className="font-medium">MetaMask</div>
                    <div className="text-xs text-gray-400">Polygon Network</div>
                  </div>
                </motion.button>
                <motion.button
                  onClick={handleConnectPhantom}
                  className="w-full px-4 py-4 border border-[#2349E2] rounded-lg flex items-center gap-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <PhantomIcon />
                  <div className="text-left">
                    <div className="font-medium">Phantom</div>
                    <div className="text-xs text-gray-400">Solana Network</div>
                  </div>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
