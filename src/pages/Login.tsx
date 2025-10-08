import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, Shield } from 'lucide-react';
import authService from '../services/authService';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    otp: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inputType, setInputType] = useState<'email' | 'phone' | ''>('');
  const [resendTimer, setResendTimer] = useState(0);

  const { login, requestLoginOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

    if (name === 'username') {
      // Detect input type
      if (authService.isValidEmail(value)) {
        setInputType('email');
      } else if (authService.isValidPhone(value)) {
        setInputType('phone');
      } else {
        setInputType('');
      }
    }
  };

  const handleSendOTP = async () => {
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

    try {
      const username = isPhone ? authService.formatPhone(formData.username) : formData.username;
      const result = await requestLoginOTP(username);

      if (result.success) {
        setOtpSent(true);
        setResendTimer(60);
        setSuccess(`OTP sent to your ${isEmail ? 'email' : 'WhatsApp'}`);
        setFormData(prev => ({ ...prev, username }));
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      const result = await login(formData.username, formData.otp);

      if (result.success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Embolo account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                    <Phone className="w-4 h-4 text-gray-400" />
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
                  disabled={loading || !formData.username || !inputType || resendTimer > 0}
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
              disabled={loading || !otpSent || !formData.otp}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              New to Embolo?{' '}
              <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
