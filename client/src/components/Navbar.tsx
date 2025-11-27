import { useState } from "react";
import { motion } from "framer-motion";
import logo from "../assets/Logo.png";
import walletIcon from "../assets/wallet.svg";
import { useWallet } from "../contexts/WalletContext";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const wallet = useWallet();

  const isConnected = wallet.isConnected;
  const displayAddress = wallet.address || "";
  const chainLabel = wallet.providerType === 'EVM' ? (wallet.chainId ? 'Polygon' : 'EVM') : wallet.providerType === 'SOL' ? 'Solana' : '';

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

  return (
    <nav className="w-full flex items-center justify-between px-4 md:px-8 py-4 mt-5 text-white">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <img src={logo} alt="Logo" className="h-8 w-auto" />
      </motion.div>

      <motion.div
        className="hidden md:flex items-center gap-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <motion.a href="#" whileHover={{ scale: 1.05 }}>Marketplace</motion.a>
        <motion.a href="#" whileHover={{ scale: 1.05 }}>Ecosystem</motion.a>

        <div className="relative">
          <motion.button
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            className="px-4 py-2 border border-[#2349E2] text-sm font-medium flex items-center gap-2 hover:bg-[#2349E2]/10 rounded"
            whileHover={{ scale: 1.05 }}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {formatAddress(displayAddress)} ({chainLabel})
              </>
            ) : (
              <>
                Connect Wallet
                <img src={walletIcon} className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {showWalletMenu && (
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              className="absolute right-0 mt-2 w-56 bg-black border border-[#2349E2] rounded shadow-lg z-50"
            >
              {isConnected ? (
                <motion.button
                  onClick={handleDisconnect}
                  className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20"
                  whileHover={{ x: 4 }}
                >
                  Disconnect Wallet
                </motion.button>
              ) : (
                <div className="flex flex-col">
                  <motion.button
                    onClick={handleConnectMetaMask}
                    className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20"
                    whileHover={{ x: 4 }}
                  >
                    Connect MetaMask (Polygon)
                  </motion.button>
                  <motion.button
                    onClick={handleConnectPhantom}
                    className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20"
                    whileHover={{ x: 4 }}
                  >
                    Connect Phantom (Solana)
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.button
        className="md:hidden flex flex-col gap-1.5"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className={`w-6 h-0.5 bg-white ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
        <span className={`w-6 h-0.5 bg-white ${isMenuOpen ? "opacity-0" : ""}`} />
        <span className={`w-6 h-0.5 bg-white ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </motion.button>

      {isMenuOpen && (
        <motion.div
          variants={mobileMenuVariants}
          initial="hidden"
          animate="visible"
          className="absolute top-full left-0 w-full bg-black/95 border-b border-[#2349E2]/30 md:hidden flex flex-col gap-4 p-6"
        >
          <motion.a href="#" whileHover={{ x: 8 }}>Marketplace</motion.a>
          <motion.a href="#" whileHover={{ x: 8 }}>Ecosystem</motion.a>

          <div className="pt-4 border-t border-[#2349E2]/30">
            <motion.button
              onClick={() => setShowWalletMenu(!showWalletMenu)}
              className="w-full px-4 py-3 border border-[#2349E2] flex items-center gap-2"
            >
              {isConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  {formatAddress(displayAddress)} ({chainLabel})
                </>
              ) : (
                <>
                  Connect Wallet
                  <img src={walletIcon} className="w-4 h-4" />
                </>
              )}
            </motion.button>

            {showWalletMenu && (
              <motion.div
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                className="mt-2 bg-black border text-white border-[#2349E2] rounded shadow-lg"
              >
                {isConnected ? (
                  <motion.button
                    onClick={handleDisconnect}
                    className="w-full text-left px-4 py-3 hover:bg-[#2349E2]/20"
                    whileHover={{ x: 4 }}
                  >
                    Disconnect Wallet
                  </motion.button>
                ) : (
                  <div className="flex flex-col">
                    <motion.button
                      onClick={handleConnectMetaMask}
                      className="w-full text-left px-4 py-3 text-white hover:bg-[#2349E2]/20"
                      whileHover={{ x: 4 }}
                    >
                      Connect MetaMask (Polygon)
                    </motion.button>
                    <motion.button
                      onClick={handleConnectPhantom}
                      className="w-full text-left px-4 py-3 text-white hover:bg-[#2349E2]/20"
                      whileHover={{ x: 4 }}
                    >
                      Connect Phantom (Solana)
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
