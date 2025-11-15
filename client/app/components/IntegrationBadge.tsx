export default function IntegrationBadge() {
  const logos = [
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
  ];

  return (
    <div className="w-full overflow-hidden bg-slate-900">
      <div className="flex gap-4 animate-scroll py-4">
        {[...logos, ...logos].map((logo, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-xs font-medium text-gray-400"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
