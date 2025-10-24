import { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';

const hindiQuotes = [
  "Lagta hai Wi-Fi ne chhutti le li! 😴 Jaldi online aao, 5% cashback aapka intezaar kar raha hai!",
  "Internet gaya, par Embolo ka dil nahi! 💖 Phir se connect karo aur cashback kamao!",
  "Network gaya toh kya hua, Embolo toh dil se connected hai! 💊 Up to 5% cashback jab signal wapas aaye!",
  "Lagta hai connection ne bhi chai pe break le liya ☕ — tab tak Embolo ke offers dream karo!",
  "Offline ho? Koi baat nahi, Embolo ka cashback toh hamesha online rehta hai! 💸",
  "Internet so gaya hai 😴, par Embolo jaag raha hai aapke 5% cashback ke saath!",
  "Wi-Fi gaya, cashback nahi! 💰 Embolo ke saath savings kabhi disconnect nahi hoti!",
  "Signal gaya, par Embolo ke faayde nahi! 🌐 Phir se connect ho jao aur 5% cashback pakdo!",
  "Internet gaya toh kya hua — distributors aur Embolo dono loyal hain! 💊 Cashback milke rahega!",
  "Aap offline ho… par Embolo ke discounts 24x7 online hain! 😉"
];

interface OfflineLoaderProps {
  isVisible: boolean;
  offlineDuration?: number;
}

export const OfflineLoader: React.FC<OfflineLoaderProps> = ({ 
  isVisible, 
  offlineDuration = 0 
}) => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Rotate quotes every 4 seconds
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % hindiQuotes.length);
        setIsAnimating(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Format offline duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds} सेकंड`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} मिनट`;
    const hours = Math.floor(minutes / 60);
    return `${hours} घंटे ${minutes % 60} मिनट`;
  };

  if (!isVisible) return null;

  return (
    <div className="offline-loader fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-green-50 to-green-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300AA63' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 tracking-wide">
            embolo
          </h1>
          <div className="w-16 h-1 bg-[#00AA63] mx-auto mt-2 rounded-full"></div>
        </div>

        {/* Offline Icon with Animation */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#00AA63] rounded-full opacity-20 animate-ping"></div>
          <div className="relative bg-white rounded-full p-6 shadow-lg border-2 border-[#00AA63]">
            <WifiOff className="w-12 h-12 text-[#00AA63]" />
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-green-200 mb-6 w-full">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-5 h-5 text-[#00AA63] animate-spin mr-2" />
            <span className="text-lg font-semibold text-gray-700">
              कनेक्शन की तलाश में...
            </span>
          </div>
          
          {offlineDuration > 0 && (
            <div className="text-sm text-gray-500 mb-4">
              ऑफलाइन समय: {formatDuration(offlineDuration)}
            </div>
          )}

          {/* Rotating Hindi Quote */}
          <div className="min-h-[60px] flex items-center justify-center">
            <p 
              className={`text-gray-600 text-sm leading-relaxed transition-all duration-300 ${
                isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
              }`}
            >
              {hindiQuotes[currentQuoteIndex]}
            </p>
          </div>
        </div>

        {/* Connection Tips */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-green-100 mb-6 w-full">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <span className="w-2 h-2 bg-[#00AA63] rounded-full mr-2"></span>
            कनेक्शन टिप्स:
          </h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Wi-Fi या मोबाइल डेटा चेक करें</li>
            <li>• एयरप्लेन मोड ऑन/ऑफ करके देखें</li>
            <li>• नेटवर्क सेटिंग्स रीफ्रेश करें</li>
          </ul>
        </div>

        {/* Session Safe Message */}
        <div className="flex items-center justify-center text-xs text-gray-500 bg-white/50 rounded-lg px-4 py-2 backdrop-blur-sm">
          <span className="mr-2">🔒</span>
          <span>आपका session safe है - वापस वहीं पहुंचेंगे जहां थे!</span>
        </div>

        {/* Pulse Animation at Bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#00AA63] rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* iOS Safe Area Handling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @supports (padding-top: env(safe-area-inset-top)) {
            .offline-loader {
              padding-top: env(safe-area-inset-top);
              padding-bottom: env(safe-area-inset-bottom);
            }
          }
        `
      }} />
    </div>
  );
};

export default OfflineLoader;
