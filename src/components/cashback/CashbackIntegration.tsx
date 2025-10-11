import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCashback } from '@/hooks/useCashback';
import CashbackPopup from './CashbackPopup';

interface CashbackIntegrationProps {
  orderValue: number;
  onOrderPlaced?: (orderId: number) => void;
  showPreview?: boolean;
}

export interface CashbackIntegrationRef {
  triggerPopup: (orderId?: number, orderValue?: number) => void;
}

const CashbackIntegration = forwardRef<CashbackIntegrationRef, CashbackIntegrationProps>(({
  orderValue,
  onOrderPlaced,
  showPreview = true
}, ref) => {
  const [showPopup, setShowPopup] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [processedOrderId, setProcessedOrderId] = useState<number | null>(null);
  const [currentOrderValue, setCurrentOrderValue] = useState<number>(orderValue);

  // Debug component mount
  useEffect(() => {
  // console.log('CashbackIntegration mounted');
    // mounted
    return () => {
      // unmounted
    };
  }, []);

  // Debug popup state changes
  useEffect(() => {
  // console.log('Popup show state:', showPopup);
  }, [showPopup]);

  // Sync orderValue prop with state
  useEffect(() => {
    setCurrentOrderValue(orderValue);
  }, [orderValue]);
  const [previewAmount, setPreviewAmount] = useState<number>(0);
  const { getCashbackPreview } = useCashback();

  // Test function to check API connectivity
  const testCashbackAPI = async () => {
    try {
      const preview = await getCashbackPreview(1000);
    } catch (error) {
      console.error('Cashback API test failed:', error);
    }
  };

  // Get cashback preview when order value changes
  useEffect(() => {
    if (showPreview && orderValue > 0) {
      const fetchPreview = async () => {
        const preview = await getCashbackPreview(orderValue);
        if (preview) {
          setPreviewAmount(preview.estimated_amount);
        }
      };
      
      fetchPreview();
    }
  }, [orderValue, showPreview, getCashbackPreview]);

  // Listen for order placed events
  useEffect(() => {
    const handleOrderEvent = (event: CustomEvent) => {
      const { orderId, orderValue: eventOrderValue } = event.detail;
      if (orderId) {
        setProcessedOrderId(orderId);
        setShowPopup(true);
        onOrderPlaced?.(orderId);
      }
    };

    window.addEventListener('orderPlaced', handleOrderEvent as EventListener);
    
    return () => {
      window.removeEventListener('orderPlaced', handleOrderEvent as EventListener);
    };
  }, [onOrderPlaced]);

  // Handle order placement
  const handleOrderPlaced = (orderId: number) => {
    setProcessedOrderId(orderId);
    setShowPopup(true);
    onOrderPlaced?.(orderId);
  };

  // 1. Show the "calculating" animation immediately
  const showCalculatingCashback = (orderValue?: number) => {
    console.log('Showing calculating cashback animation...');
    setIsCalculating(true);
    setProcessedOrderId(null);
    if (orderValue !== undefined) {
      setCurrentOrderValue(orderValue);
    }
    setShowPopup(true);
  };

  // Trigger cashback popup manually (for testing or manual triggers)
  // 2. This function now receives the orderId and shows the final result
  const triggerCashbackPopup = (orderId?: number, orderValue?: number) => {
    console.log('Triggering final cashback popup for orderId:', orderId);
    if (orderId) {
      setProcessedOrderId(orderId);
    }
    setIsCalculating(false); // We have an orderId, so we are no longer just "calculating"
    setShowPopup(true);
  };

  // Expose method via ref
  useImperativeHandle(ref, () => ({
    triggerPopup: triggerCashbackPopup
  }));

  // Expose trigger function to window object
  useEffect(() => {
    (window as any).showCalculatingCashback = showCalculatingCashback;
    (window as any).triggerCashbackPopup = triggerCashbackPopup;
    
    return () => {
      delete (window as any).showCalculatingCashback;
      delete (window as any).triggerCashbackPopup;
    };
  }, []);

  return (
    <>
      {/* Cashback Preview Card */}
      {showPreview && orderValue > 0 && previewAmount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-primary to-green-500 p-2 rounded-full">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      Cashback Reward
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="text-sm text-gray-600">
                      Estimated for this order
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{previewAmount.toFixed(2)}
                  </div>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Estimated
                  </Badge>
                </div>
              </div>
              
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="mt-3 h-1 bg-gradient-to-r from-primary to-green-500 rounded-full"
              />
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                🚀 Keep ordering consistently to earn higher rewards!
              </div>
              
              {/* Temporary debug buttons - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 flex gap-2 justify-center">
                  <button 
                    onClick={testCashbackAPI}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Test API
                  </button>
                  <button 
                    onClick={() => triggerCashbackPopup(12345)}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                  >
                    Test Popup
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cashback Popup */}
      <CashbackPopup
        isOpen={showPopup}
        onClose={() => {
          setShowPopup(false);
          setProcessedOrderId(null);
          setIsCalculating(false);
        }}
        orderId={processedOrderId || undefined}
        orderValue={currentOrderValue}
        onOrderSuccess={() => {
          // Handle successful order processing
          // Don't close popup here - let it auto-close after animation
        }}
      />
    </>
  );
});

CashbackIntegration.displayName = 'CashbackIntegration';

export default CashbackIntegration;
