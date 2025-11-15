export default function Footer() {
  const links = [
    { label: "PROJECTS", href: "#" },
    { label: "USER SUPPORT", href: "#" },
    { label: "LEGAL & POLICIES", href: "#" },
  ];

  const integrations = [
    "Ethereum",
    "dApp",
    "Thala",
    "0x",
    "1Inch",
    "Brechain",
    "Shad",
    "Solana",
    "dApp",
    "Thala",
    "0x",
    "1Inch",
    "Brechain",
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* Links */}
        <div className="flex flex-wrap gap-8 md:gap-12 mb-12 pb-8 border-b border-slate-800">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-white transition"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Integrations */}
        <div className="mb-12">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-6">
            [ INTEGRATING MADE EASY USING ]
          </p>
          <div className="flex flex-wrap gap-4">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2 text-xs text-gray-300 hover:border-blue-500/50 transition"
              >
                {integration}
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              🔷 Predictify
            </span>
          </div>
          <p className="text-xs text-gray-500">© 2025 Predictify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
