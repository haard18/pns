import { useEffect, useRef } from "react";

// Import logos
import polymarket from "../assets/logos/polymarket.png";
import solana from "../assets/logos/solana.png";
import metaplex from "../assets/logos/metaplex.png";
import pyth from "../assets/logos/pyth.png";
import polygonscan from "../assets/logos/polygonscan.png";
import phantom from "../assets/logos/phantom.png";
import metamask from "../assets/logos/metamask.png";
import arweave from "../assets/logos/arweave.png";
import magiceden from "../assets/logos/magiceden.png";
import solscan from "../assets/logos/solscan.jpeg";
import polygon from "../assets/logos/polygon.png";

export default function AutoCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let pos = 0;
    const speed = 0.5;

    // Wait for layout to complete
    const startAnimation = () => {
      const singleSetWidth = track.scrollWidth / 3; // We have 3 sets now
      
      function animate() {
        pos -= speed;
        
        // Reset when first set is completely off-screen
        if (Math.abs(pos) >= singleSetWidth) {
          pos += singleSetWidth;
        }
        
        track!.style.transform = `translateX(${pos}px)`;
        animationRef.current = requestAnimationFrame(animate);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startAnimation, 100);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);



  const logos = [
    { name: "Polymarket", img: polymarket },
    { name: "Solana", img: solana },
    { name: "MetaPlex", img: metaplex },
    { name: "Pyth", img: pyth },
    { name: "PolygonScan", img: polygonscan },
    { name: "Phantom", img: phantom },
    { name: "MetaMask", img: metamask },
    { name: "Arweave", img: arweave },
    { name: "Magic Eden", img: magiceden },
    { name: "Solscan", img: solscan },
    { name: "Polygon", img: polygon },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 py-4">
      <div className="text-center text-white text-xs tracking-widest mb-4 font-mono">
        [ INTEGRATION MADE EASY USING ]
      </div>
      
      <div className="overflow-hidden w-full bg-black py-6">
        <div
          ref={trackRef}
          className="flex gap-8 will-change-transform"
          style={{ width: "max-content" }}
        >
          {/* Triple the logos for ultra-smooth infinite scroll */}
          {[...logos, ...logos, ...logos].map((logo, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-6 py-3 bg-gray-900/50 rounded-lg border border-gray-800 select-none pointer-events-none"
              draggable={false}
            >
              <img src={logo.img} alt={logo.name} className="h-5 w-auto "  />
              <span className="text-white font-medium whitespace-nowrap">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}