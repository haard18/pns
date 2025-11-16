import logo from "../assets/Logo.png";
import wallet from "../assets/wallet.svg"
export default function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 mt-5">
      {/* Left side */}
      <div className="flex items-center gap-8 ">
        <img src={logo} alt="Logo" className="h-8 w-auto" />
      </div>

      {/* Right side */}
      <div
        className="flex items-center gap-6 "
        style={{ color: "var(--text-light)" }}
      >
        {/* Logo */}
        <a href="#" className="transition">
          Marketplace
        </a>
        <a href="#" className="transition">
          Ecosystem
        </a>
        {/* Connect Wallet */}
        <button className="px-4 py-2 border border-[#2349E2] transition text-sm font-medium flex items-center gap-2">
          Connect Wallet
          <img src={wallet} alt="Connect Wallet" />
        </button>
      </div>
    </nav>
  );
}
