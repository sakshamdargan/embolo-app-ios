import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Sparkles, Gift, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCashback } from '@/hooks/useCashback';
import confetti from 'canvas-confetti';

interface CashbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  orderValue?: number;
  onOrderSuccess?: () => void;
}

type PopupState = 'calculating' | 'success' | 'error' | 'closed';

const CashbackPopup: React.FC<CashbackPopupProps> = ({
  isOpen,
  onClose,
  orderId,
  orderValue = 0,
  onOrderSuccess
}) => {
  const [state, setState] = useState<PopupState>('calculating');
  const [cashbackAmount, setCashbackAmount] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const { getCashbackPreview, processCashback, loading } = useCashback();

  // Debug logging
  useEffect(() => {
    console.log('CashbackPopup props changed:', { isOpen, orderId, orderValue });
  }, [isOpen, orderId, orderValue]);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      console.log('CashbackPopup opened, resetting state to calculating');
      setState('calculating');
      setProgress(0);
    }
  }, [isOpen]);

  // Simulate progress animation
  useEffect(() => {
    if (isOpen && state === 'calculating') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isOpen, state]);

  // Handle cashback calculation
  useEffect(() => {
    if (isOpen && orderId) {
      // Process actual cashback for completed order
      const processOrderCashback = async () => {
        try {
          console.log('Processing cashback for order:', orderId, 'with value:', orderValue);
          const result = await processCashback(orderId, orderValue);
          console.log('Cashback result:', result);
          
          if (result && result.amount > 0) {
            setCashbackAmount(result.amount);
            setProgress(100);
            setTimeout(() => {
              setState('success');
              triggerConfetti();
              onOrderSuccess?.();
            }, 1000);
          } else {
            console.error('Invalid cashback result:', result);
            setState('error');
          }
        } catch (error) {
          console.error('Cashback processing failed:', error);
          setState('error');
        }
      };

      processOrderCashback();
    } else if (isOpen && orderValue >= 0) {
      // Show preview for order value
      const getPreview = async () => {
        try {
          console.log('Getting cashback preview for value:', orderValue);
          const preview = await getCashbackPreview(orderValue);
          console.log('Backend preview result:', preview);
          
          if (preview && preview.estimated_amount && preview.estimated_amount > 0) {
            setCashbackAmount(preview.estimated_amount);
            setProgress(100);
            setTimeout(() => {
              setState('success');
              triggerConfetti();
            }, 1500);
          } else {
            console.error('Backend returned invalid preview:', preview);
            setState('error');
          }
        } catch (error) {
          console.error('Backend cashback preview failed:', error);
          setState('error');
        }
      };

      getPreview();
    }
  }, [isOpen, orderId, orderValue, processCashback, getCashbackPreview, onOrderSuccess]);

  const triggerConfetti = () => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleClose = () => {
    setState('closed');
    setProgress(0);
    setCashbackAmount(0);
    onClose();
  };

  const rocketVariants = {
    initial: { y: 100, opacity: 0, rotate: -45 },
    animate: { 
      y: [100, -20, -10, -30],
      opacity: 1,
      rotate: [-45, -30, -35, -25],
      transition: {
        duration: 2,
        times: [0, 0.6, 0.8, 1],
        ease: "easeOut"
      }
    },
    success: {
      y: -50,
      rotate: 0,
      scale: 1.2,
      transition: { duration: 0.5 }
    }
  };

  const sparkleVariants = {
    animate: {
      scale: [1, 1.5, 1],
      rotate: [0, 180, 360],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50 border-2 border-primary/20 shadow-2xl">
              <CardContent className="p-8 text-center relative">
                {/* Background sparkles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      variants={sparkleVariants}
                      animate="animate"
                      className="absolute"
                      style={{
                        left: `${20 + (i * 15)}%`,
                        top: `${10 + (i * 12)}%`,
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-primary/30" />
                    </motion.div>
                  ))}
                </div>

                {state === 'calculating' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Animated Rocket */}
                    <div className="relative h-32 flex items-center justify-center">
                      <motion.div
                        variants={rocketVariants}
                        initial="initial"
                        animate="animate"
                        className="relative"
                      >
                        <Rocket className="w-16 h-16 text-primary" />
                        {/* Rocket trail */}
                        <motion.div
                          animate={{
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 1.5],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeOut"
                          }}
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full blur-sm"
                        />
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <motion.h2
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="text-2xl font-bold text-gray-800"
                      >
                        🚀 Calculating Cashback...
                      </motion.h2>
                      
                      <p className="text-gray-600">
                        Our dopamine-driven algorithm is working its magic!
                      </p>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        {progress < 30 && "Analyzing your order streak..."}
                        {progress >= 30 && progress < 60 && "Calculating engagement bonus..."}
                        {progress >= 60 && progress < 90 && "Applying loyalty multipliers..."}
                        {progress >= 90 && "Almost ready! 🎉"}
                      </p>
                    </div>
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="space-y-6"
                  >
                    {/* Success rocket */}
                    <motion.div
                      variants={rocketVariants}
                      animate="success"
                      className="relative h-20 flex items-center justify-center"
                    >
                      <div className="relative">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                          className="absolute inset-0 rounded-full border-4 border-green-300"
                        />
                      </div>
                    </motion.div>

                    <div className="space-y-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15 }}
                      >
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">
                          🎉 Cashback Earned!
                        </h2>
                        <div className="bg-gradient-to-r from-primary to-green-500 text-white rounded-xl p-4 mb-4">
                          <div className="text-4xl font-bold">
                            ₹{cashbackAmount.toFixed(2)}
                          </div>
                          <div className="text-sm opacity-90">
                            {orderId ? 'Added to your wallet!' : 'Estimated cashback'}
                          </div>
                        </div>
                      </motion.div>

                      <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600"
                      >
                        {orderId 
                          ? "Your cashback will be credited once approved by our team!"
                          : "This is your estimated cashback for this order value."
                        }
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Button
                          onClick={handleClose}
                          className="w-full bg-gradient-to-r from-primary to-green-500 hover:from-primary/90 hover:to-green-500/90 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Gift className="w-5 h-5 mr-2" />
                          Awesome! Continue Shopping
                        </Button>
                        
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Popup will stay open until you click the button
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {state === 'error' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="text-6xl">😅</div>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-bold text-gray-800">
                        Cashback Processing Issue
                      </h2>
                      <p className="text-gray-600">
                        Don't worry! Your order was placed successfully. 
                        {orderId ? (
                          <>
                            <br /><br />
                            Your cashback will be processed manually and added to your wallet within 24 hours.
                            You can check your wallet balance in the app.
                          </>
                        ) : (
                          <>
                            <br /><br />
                            Please ensure you're logged in to see your cashback estimate.
                          </>
                        )}
                      </p>
                      <Button
                        onClick={handleClose}
                        className="w-full"
                        variant="outline"
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Loading overlay */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CashbackPopup;
