import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DaimoPayProvider, getDefaultConfig } from '@daimo/pay';
import "./App.css";
import Home from "./pages/Home";
import { Routes, BrowserRouter as Router, Route } from "react-router-dom";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import RegisterDomain from "./pages/RegisterDomain";
import Domain from "./pages/Domain";
import ManageDomain from "./pages/ManageDomain";
// import Marketplace from "./pages/Marketplace";
import Explore from "./pages/Explore";
// import WaitlistPage from "./pages/WaitlistPage";
import { DAIMO_API_URL, DAIMO_CONFIG } from './config/daimoConfig';

// Use Daimo's getDefaultConfig which includes all required chains
// This automatically configures: Arbitrum, Base, BSC, Celo, Linea, Gnosis, 
// Ethereum, Polygon, Optimism, Scroll, and World Chain
const config = createConfig(
  getDefaultConfig({
    appName: 'Polygon Name Service',
  })
);

// React Query
const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <DaimoPayProvider payApiUrl={DAIMO_API_URL} debugMode={DAIMO_CONFIG.debugMode}>
          <RainbowKitProvider>
            <Router>
              <Routes>
                {/* Temporary Waitlist Gating */}
                {/* <Route path="*" element={<WaitlistPage />} /> */}
                <Route path="/" element={<Home />} />

              {/* Original Routes - Uncomment to restore */}
              
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/register" element={<RegisterDomain />} />
              <Route path="/domains" element={<Domain />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/manage/:domainName" element={<ManageDomain />} />
              <Route path="/marketplace" element={<Explore />} />
             
            </Routes>
          </Router>
        </RainbowKitProvider>
        </DaimoPayProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;