import Navbar from "./components/Navbar";
import FeatureCard from "./components/FeatureCard";
import MiniStatCard from "./components/MiniStatCard";
import GradientBars from "./components/GradientBars";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:px-8 overflow-hidden">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-blue-950/30 via-slate-900 to-slate-900 -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Claim Your Web3 Identity
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-12 max-w-2xl mx-auto">
            Simplify your Predictify experience with .poly domains — your name,
            your reputation, your data identity.
          </p>

          {/* Search Bar */}
          <div className="flex gap-2 max-w-2xl mx-auto mb-20">
            <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2 hover:border-slate-600 transition">
              <span className="text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search your .poly name"
                className="bg-transparent outline-none text-white placeholder-gray-400 w-full text-sm"
              />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              Search
            </button>
          </div>

          {/* Gradient Bars */}
          <GradientBars />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
              [ FEATURES ]
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              What You Can Do?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Discover how your .poly domain empowers you to own, connect, and
              grow your identity across the Predictify ecosystem.
            </p>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Own your name"
              description="Your .poly domain is completely yours — decentralized, secure, and transferable."
            />
            <FeatureCard
              title="Unify your identity"
              description="Link your wallet, profiles, assets, and profile under one name."
            />
            <FeatureCard
              title="Share with ease"
              description="Share send/receive predictions, data, or rewards directly through yourname.poly"
            />
            <FeatureCard
              title="Build your community"
              description="Create a dedicated space for your audience, collaborators — like username.poly or projectname.poly"
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 px-4 md:px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side with 3 stat cards */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
                  [ COMMUNITY ]
                </span>
                <h2 className="text-4xl md:text-5xl font-bold text-white mt-4">
                  Join the .poly Community
                </h2>
              </div>
              <p className="text-gray-400 text-lg">
                From builders to creatives, we believe in the power of open,
                predictive collaboration. Join thousands of others who believe
                in the power of open, predictive collaboration — we're building
                the next space full for innovation, creativity, and shared
                growth.
              </p>

              <div className="flex gap-4 pt-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                  Claim your .poly
                </button>
                <button className="border border-blue-600 text-blue-400 hover:bg-blue-600/10 px-6 py-2 rounded-lg font-semibold text-sm transition">
                  Join the community →
                </button>
              </div>
            </div>

            {/* Right side with grid of stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MiniStatCard
                number="01"
                title="Your Identity, Your Space"
                description="Build your personal brand and expand your presence to Predictify"
              />
              <MiniStatCard
                number="02"
                title="Connect & Collaborate"
                description="Join builders, trades, and community collaborators — all with one name"
              />
              <MiniStatCard
                number="03"
                title="Grow with Predictify"
                description="Earn recognition, rewards and visibility through your .poly domain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center mb-8">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            [ INTEGRATING MADE EASY USING ]
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 justify-center flex-wrap">
          {[
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
          ].map((name, idx) => (
            <div
              key={idx}
              className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2 text-xs text-gray-400 whitespace-nowrap hover:border-blue-500/50 transition"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4 md:px-8 bg-slate-900">
        <div className="max-w-2xl mx-auto text-center border border-slate-700 rounded-2xl p-12 bg-slate-800/30">
          <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
            [ CONNECT ]
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-6 mb-4">
            Let's Connect.
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            This isn't just another platform — it's a growing network of
            builders, traders, and collaborators shaping how we transact, share
            insights, and consolidate the next generation of Web3.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition">
            Join the Community →
          </button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
