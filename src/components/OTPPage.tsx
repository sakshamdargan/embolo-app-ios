import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Smartphone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import authService from '../services/authService';
import { NetworkTest } from '../utils/networkTest';
import { SimpleNetworkTest } from '../utils/simpleNetworkTest';
import { IOSNetworkDiagnostic } from '../utils/iosNetworkDiagnostic';

interface OTPPageProps {
  mode?: 'login' | 'register';
  phone?: string;
  email?: string;
  onSuccess?: () => void;
}

const OTPPage: React.FC<OTPPageProps> = ({ 
  mode = 'login', 
  phone, 
  email, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    username: phone || email || '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inputType, setInputType] = useState<'email' | 'phone' | ''>('');
  const [resendTimer, setResendTimer] = useState(0);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const { login, requestLoginOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Capture console logs for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setDebugLogs(prev => [...prev.slice(-50), `[LOG] ${message}`]); // Keep last 50 logs
      originalLog.apply(console, args);
    };
    
    console.error = (...args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setDebugLogs(prev => [...prev.slice(-50), `[ERROR] ${message}`]);
      originalError.apply(console, args);
    };
    
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Check network status and platform
  useEffect(() => {
    const checkNetworkStatus = () => {
      if (navigator.onLine) {
        setNetworkStatus('online');
      } else {
        setNetworkStatus('offline');
        setError('No internet connection. Please check your network and try again.');
      }
    };

    checkNetworkStatus();
    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);

    return () => {
      window.removeEventListener('online', checkNetworkStatus);
      window.removeEventListener('offline', checkNetworkStatus);
    };
  }, []);

  // Auto-detect input type
  useEffect(() => {
    if (formData.username) {
      if (authService.isValidEmail(formData.username)) {
        setInputType('email');
      } else if (authService.isValidPhone(formData.username)) {
        setInputType('phone');
      } else {
        setInputType('');
      }
    }
  }, [formData.username]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Resend timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSendOTP = async () => {
    if (networkStatus === 'offline') {
      setError('No internet connection. Please check your network and try again.');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please enter your email or phone number');
      return;
    }

    const isEmail = authService.isValidEmail(formData.username);
    const isPhone = authService.isValidPhone(formData.username);

    if (!isEmail && !isPhone) {
      setError('Please enter a valid email address or 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const username = isPhone ? authService.formatPhone(formData.username) : formData.username;
      
      console.log(`🚀 Platform: ${Capacitor.getPlatform()}, Native: ${Capacitor.isNativePlatform()}`);
      console.log(`📱 Sending OTP to: ${username}`);
      
      const result = await requestLoginOTP(username);

      if (result.success) {
        setOtpSent(true);
        setResendTimer(60);
        setSuccess(`OTP sent to your ${isEmail ? 'email' : 'WhatsApp'}`);
        setFormData(prev => ({ ...prev, username }));
        
        // Show platform-specific success message
        if (Capacitor.isNativePlatform()) {
          setSuccess(`✅ OTP sent successfully via ${Capacitor.getPlatform()} app to your ${isEmail ? 'email' : 'WhatsApp'}`);
        }
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('❌ OTP Send Error:', error);
      
      // Enhanced error handling for different scenarios
      if (error.message.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (networkStatus === 'offline') {
      setError('No internet connection. Please check your network and try again.');
      return;
    }
    
    if (!formData.otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!authService.isValidOTP(formData.otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log(`🔐 Verifying OTP for: ${formData.username}`);
      
      const result = await login(formData.username, formData.otp);

      if (result.success) {
        setSuccess('✅ Login successful! Redirecting...');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        } else {
          const from = location.state?.from?.pathname || '/';
          setTimeout(() => navigate(from, { replace: true }), 1000);
        }
      } else {
        setError(result.error || 'Invalid OTP. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ OTP Verification Error:', error);
      
      if (error.message.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        setError(error.message || 'Invalid OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = () => {
    if (Capacitor.isNativePlatform()) {
      return <Smartphone className="w-4 h-4 text-green-600" />;
    }
    return <Shield className="w-4 h-4 text-blue-600" />;
  };

  const getPlatformInfo = () => {
    if (Capacitor.isNativePlatform()) {
      return `Running on ${Capacitor.getPlatform()} app`;
    }
    return 'Running on web browser';
  };

  const handleNetworkTest = async () => {
    console.log('🧪 Starting comprehensive network diagnostic...');
    setError('');
    setSuccess('Running comprehensive network diagnostic... Check console for detailed results.');
    
    try {
      await IOSNetworkDiagnostic.runFullDiagnostic();
      setSuccess('Network diagnostic completed. Check console for detailed results.');
    } catch (error) {
      console.error('Network diagnostic failed:', error);
      setError('Network diagnostic failed. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'login' ? 'Sign in to your Embolo account' : 'Register for Embolo'}
          </CardDescription>
          
          {/* Platform indicator */}
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
            {getPlatformIcon()}
            <span>{getPlatformInfo()}</span>
            <div className={`w-2 h-2 rounded-full ${networkStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Network status warning */}
          {networkStatus === 'offline' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No internet connection. Please check your network.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email or Phone Number</Label>
              <div className="relative">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter email or 10-digit phone number"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={loading || otpSent}
                  className="pl-10"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {inputType === 'email' ? (
                    <Mail className="w-4 h-4 text-gray-400" />
                  ) : inputType === 'phone' ? (
                    <Smartphone className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Mail className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {formData.username && (
                <p className="text-xs text-gray-500">
                  {inputType === 'email' ? '📧 Email format detected' :
                   inputType === 'phone' ? '📱 Phone format detected' :
                   '⚠️ Please enter valid email or phone number'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <div className="flex gap-2">
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={otpSent ? "secondary" : "outline"}
                  onClick={handleSendOTP}
                  disabled={loading || !formData.username || !inputType || resendTimer > 0 || networkStatus === 'offline'}
                  className="whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : resendTimer > 0 ? (
                    `Resend (${resendTimer}s)`
                  ) : otpSent ? (
                    'Resend OTP'
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
              {otpSent && (
                <p className="text-xs text-green-600">
                  OTP sent! Check your {inputType === 'phone' ? 'WhatsApp messages' : 'email inbox'}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !otpSent || !formData.otp || networkStatus === 'offline'}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          {/* Comprehensive Debug Panel */}
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="text-xs font-semibold text-gray-700">🔍 Debug Information</div>
            
            {/* Platform Info */}
            <div className="text-xs bg-blue-50 p-2 rounded space-y-1">
              <div className="font-semibold text-blue-800">Platform Info:</div>
              <div>Platform: <span className="font-mono">{Capacitor.getPlatform()}</span></div>
              <div>Native: <span className="font-mono">{Capacitor.isNativePlatform() ? 'Yes' : 'No'}</span></div>
              <div>Network: <span className={`font-mono ${networkStatus === 'online' ? 'text-green-600' : 'text-red-600'}`}>{networkStatus}</span></div>
              <div>API URL: <span className="font-mono text-xs break-all">https://embolo.in/wp-json/eco-swift/v1</span></div>
            </div>

            {/* Test Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNetworkTest}
                className="flex-1 text-xs"
              >
                🧪 Test Network
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDebugLogs([])}
                className="flex-1 text-xs"
              >
                🗑️ Clear Logs
              </Button>
            </div>

            {/* Live Console Logs */}
            {debugLogs.length > 0 && (
              <div className="text-xs bg-gray-900 text-green-400 p-3 rounded font-mono max-h-64 overflow-y-auto">
                <div className="font-semibold text-white mb-2">📝 Console Logs (Live):</div>
                {debugLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`py-1 ${log.includes('[ERROR]') ? 'text-red-400' : 'text-green-400'}`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs bg-yellow-50 p-2 rounded text-yellow-800">
              <div className="font-semibold mb-1">💡 Debugging Tips:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>All network requests are logged above with 🔵 emoji</li>
                <li>Look for 🔴 emoji to see errors</li>
                <li>Check if CapacitorHttp or axios is being used</li>
                <li>Verify the response status and data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPPage;
