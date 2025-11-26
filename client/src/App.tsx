import { WagmiProvider, createConfig, http } from "wagmi";
import { polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected } from "wagmi/connectors";
import "./App.css";
import Home from "./pages/Home";
import { Routes, BrowserRouter as Router, Route } from "react-router-dom";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import RegisterDomain from "./pages/RegisterDomain";
import Domain from "./pages/Domain";
import ManageDomain from "./pages/ManageDomain";
import { WalletProvider } from "./contexts/WalletContext";

// Wagmi config for Polygon
const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [injected()], // <-- THIS IS REQUIRED
  transports: {
    [polygon.id]: http(),
  },
});

// React Query
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/register" element={<RegisterDomain />} />
              <Route path="/domains" element={<Domain />} />
              <Route path="/manage/:domainName" element={<ManageDomain />} />
            </Routes>
          </Router>
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;