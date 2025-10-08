import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User as UserIcon, Mail, LogOut, Package, Building } from 'lucide-react';

const User = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary p-6 shadow-md">
        <h1 className="text-2xl font-bold text-primary-foreground">
          My Account
        </h1>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-6 h-6" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                </div>
              </div>
              
              {user?.shop_name && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{user.shop_name}</p>
                    <p className="text-xs text-muted-foreground">Shop Name</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Building className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium capitalize">{user?.business_type || 'Chemist'}</p>
                  <p className="text-xs text-muted-foreground">Business Type</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => navigate('/orders')}
                className="w-full gap-2"
                variant="outline"
              >
                <Package className="w-5 h-5" />
                View Order History
              </Button>

              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default User;
