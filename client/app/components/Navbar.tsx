export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-gradient-to-b from-slate-900 to-transparent z-50 px-4 md:px-8 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            🔷 Predictify
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-gray-300 hover:text-white transition">
            Marketplace
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition">
            Ecosystem
          </a>
          <a href="#" className="text-sm text-gray-300 hover:text-white transition">
            Connect Wallet
          </a>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          Connect Wallet
        </button>
      </div>
    </nav>
  );
}
