import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/Logo.png";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useConfig } from 'wagmi';
import { readContract } from 'wagmi/actions';

const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' as `0x${string}`;

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const { address } = useAccount();
  const config = useConfig();
  const location = useLocation();

  // Fetch USDC balance when wallet address changes
  useEffect(() => {
    if (address) {
      const fetchBalance = async () => {
        try {
          const balance = await readContract(config, {
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as bigint;
          
          // Convert from 6 decimals to readable format
          const formatted = (Number(balance) / 1e6).toFixed(2);
          setUsdcBalance(formatted);
        } catch (error) {
          console.error('Failed to fetch USDC balance:', error);
          setUsdcBalance(null);
        }
      };

      fetchBalance();
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    } else {
      setUsdcBalance(null);
    }
  }, [address, config]);

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

        {/* USDC Balance Display */}
        {address && usdcBalance !== null && (
          <div className="px-4 py-2 bg-[#2349E2]/20 border border-[#2349E2] rounded text-white text-sm">
            {usdcBalance} USDC
          </div>
        )}

        {/* RainbowKit Connect Button */}
        <ConnectButton />
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

          {/* USDC Balance Display for Mobile */}
          {address && usdcBalance !== null && (
            <div className="px-4 py-2 bg-[#2349E2]/20 border border-[#2349E2] rounded text-white text-sm w-fit">
              {usdcBalance} USDC
            </div>
          )}

          <div className="pt-6 border-t border-[#2349E2]/30">
            <div className="text-sm text-gray-400 mb-4">Connect Wallet</div>
            {/* RainbowKit Connect Button for Mobile */}
            <ConnectButton />
          </div>
        </motion.div>
      )}
    </nav>
  );
}
