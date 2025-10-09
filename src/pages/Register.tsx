import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, UserPlus, Building, Pill, Truck, ArrowLeft, ArrowRight } from 'lucide-react';
import authService, { RegistrationData } from '../services/authService';

interface LicenseData {
  has_license_20: boolean;
  license_20_number: string;
  license_20_expiry: string;
  has_license_21: boolean;
  license_21_number: string;
  license_21_expiry: string;
}

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    otp: '',
    shop_name: '',
    owner_first_name: '',
    owner_last_name: '',
    business_type: 'chemist',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'IN'
  });
  const [licenseData, setLicenseData] = useState<LicenseData>({
    has_license_20: false,
    license_20_number: '',
    license_20_expiry: '',
    has_license_21: false,
    license_21_number: '',
    license_21_expiry: ''
  });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const { register, requestRegisterOTP, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    
    // Special handling for OTP - only allow numeric input
    if (name === 'otp') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'phone') {
      // Only allow numeric input for phone
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'postcode') {
      // Only allow numeric input for postcode
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const handleLicenseChange = (field: keyof LicenseData, value: string | boolean) => {
    setLicenseData(prev => ({ ...prev, [field]: value as any }));
  };

  const handleSendOTP = async () => {
    if (!formData.phone.trim() || !formData.email.trim()) {
      setError('Please enter both phone number and email');
      return;
    }

    if (formData.phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!authService.isValidPhone(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (!authService.isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const phone = authService.formatPhone(formData.phone);
      const result = await requestRegisterOTP(phone, formData.email);

      if (result.success) {
        setOtpSent(true);
        setResendTimer(60);
        setSuccess('Verification code sent to your WhatsApp number');
        setFormData(prev => ({ ...prev, phone }));
      } else {
        setError(result.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.phone && formData.email && formData.otp && otpSent && formData.otp.length === 6);
      case 2:
        const basicValid = !!(formData.shop_name && formData.owner_first_name && formData.owner_last_name);
        const licenseValid = licenseData.has_license_20 || licenseData.has_license_21;
        const license20Valid = !licenseData.has_license_20 || !!(licenseData.license_20_number?.trim() && licenseData.license_20_expiry);
        const license21Valid = !licenseData.has_license_21 || !!(licenseData.license_21_number?.trim() && licenseData.license_21_expiry);
        return basicValid && licenseValid && license20Valid && license21Valid;
      case 3:
        return !!(formData.address && formData.city && formData.state && formData.postcode && formData.postcode.length === 6);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please complete all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Clean and validate license data before sending
      const cleanLicenseData = {
        has_license_20: licenseData.has_license_20,
        license_20_number: licenseData.has_license_20 ? licenseData.license_20_number.trim() : '',
        license_20_expiry: licenseData.has_license_20 ? licenseData.license_20_expiry : '',
        has_license_21: licenseData.has_license_21,
        license_21_number: licenseData.has_license_21 ? licenseData.license_21_number.trim() : '',
        license_21_expiry: licenseData.has_license_21 ? licenseData.license_21_expiry : ''
      };

      const registrationData: RegistrationData = {
        ...formData,
        license_data: cleanLicenseData
      };

      const result = await register(registrationData);

      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="flex justify-between mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 mx-2 ${
                step < currentStep ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Account Verification</h3>
        <p className="text-sm text-gray-600">Enter your contact details to get started</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="Enter 10-digit phone number"
          value={formData.phone}
          onChange={handleInputChange}
          disabled={loading || otpSent}
          maxLength={10}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleInputChange}
          disabled={loading || otpSent}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code *</Label>
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
            disabled={loading || !formData.phone || !formData.email || resendTimer > 0}
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
            Verification code sent to your WhatsApp number. Please check and enter the code.
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={handleNext}
        disabled={!validateStep(1)}
        className="w-full"
      >
        Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Business Information</h3>
        <p className="text-sm text-gray-600">Complete your business details</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shop_name">Shop/Firm Name *</Label>
        <Input
          id="shop_name"
          name="shop_name"
          type="text"
          placeholder="Enter your shop or firm name"
          value={formData.shop_name}
          onChange={handleInputChange}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="owner_first_name">Owner First Name *</Label>
          <Input
            id="owner_first_name"
            name="owner_first_name"
            type="text"
            placeholder="First name"
            value={formData.owner_first_name}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_last_name">Owner Last Name *</Label>
          <Input
            id="owner_last_name"
            name="owner_last_name"
            type="text"
            placeholder="Last name"
            value={formData.owner_last_name}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* License Section */}
      <div className="border-t pt-4">
        <h4 className="font-medium mb-4">Drug License Information *</h4>
        <p className="text-sm text-gray-600 mb-4">
          Please select at least one license type and provide its details.
        </p>

        {/* License 20/20B */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_license_20"
              checked={licenseData.has_license_20}
              onCheckedChange={(checked) => handleLicenseChange('has_license_20', !!checked)}
            />
            <Label htmlFor="has_license_20" className="font-medium">
              20/20B License (Retail)
            </Label>
          </div>

          {licenseData.has_license_20 && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label htmlFor="license_20_number">License Number *</Label>
                <Input
                  id="license_20_number"
                  type="text"
                  placeholder="Enter license number"
                  value={licenseData.license_20_number}
                  onChange={(e) => handleLicenseChange('license_20_number', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_20_expiry">Expiry Date *</Label>
                <Input
                  id="license_20_expiry"
                  type="date"
                  value={licenseData.license_20_expiry}
                  onChange={(e) => handleLicenseChange('license_20_expiry', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* License 21/21B */}
        <div className="space-y-3 p-4 border rounded-lg">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_license_21"
              checked={licenseData.has_license_21}
              onCheckedChange={(checked) => handleLicenseChange('has_license_21', !!checked)}
            />
            <Label htmlFor="has_license_21" className="font-medium">
              21/21B License (Wholesale)
            </Label>
          </div>

          {licenseData.has_license_21 && (
            <div className="space-y-3 ml-6">
              <div className="space-y-2">
                <Label htmlFor="license_21_number">License Number *</Label>
                <Input
                  id="license_21_number"
                  type="text"
                  placeholder="Enter license number"
                  value={licenseData.license_21_number}
                  onChange={(e) => handleLicenseChange('license_21_number', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_21_expiry">Expiry Date *</Label>
                <Input
                  id="license_21_expiry"
                  type="date"
                  value={licenseData.license_21_expiry}
                  onChange={(e) => handleLicenseChange('license_21_expiry', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!validateStep(2)}
          className="flex-1"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Shop Address</h3>
        <p className="text-sm text-gray-600">Enter your shop address details</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Shop Address *</Label>
        <Input
          id="address"
          name="address"
          type="text"
          placeholder="Enter your shop address"
          value={formData.address}
          onChange={handleInputChange}
          disabled={loading}
        />
        <p className="text-xs text-gray-500">
          Enter your complete shop address including building name, street, area
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            name="state"
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={handleInputChange}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postcode">PIN Code *</Label>
          <Input
            id="postcode"
            name="postcode"
            type="text"
            placeholder="PIN Code"
            value={formData.postcode}
            onChange={handleInputChange}
            disabled={loading}
            maxLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            type="text"
            value="India"
            disabled
            className="bg-gray-50"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This address will be used for delivery and business verification purposes.
          Please ensure all details are accurate.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          type="submit"
          disabled={loading || !validateStep(3)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Registering...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Join Embolo</CardTitle>
          <CardDescription>
            Create your chemist account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderProgressBar()}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRegister}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </form>

          <div className="text-center pt-4 mt-6 border-t">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
