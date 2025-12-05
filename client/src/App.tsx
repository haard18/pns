import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon, polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import Home from "./pages/Home";
import { Routes, BrowserRouter as Router, Route } from "react-router-dom";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import RegisterDomain from "./pages/RegisterDomain";
import Domain from "./pages/Domain";
import ManageDomain from "./pages/ManageDomain";
import Marketplace from "./pages/Marketplace";

// RainbowKit + Wagmi config for Polygon
const config = getDefaultConfig({
  appName: 'Polygon Name Service',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [polygon, polygonAmoy],
  ssr: false,
});

// React Query
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/register" element={<RegisterDomain />} />
              <Route path="/domains" element={<Domain />} />
              <Route path="/manage/:domainName" element={<ManageDomain />} />
              <Route path="/marketplace" element={<Marketplace />} />
            </Routes>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;