import { Bell, Calendar, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Update {
  id: number;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
  isNew: boolean;
}

const Updates = () => {
  // Mock data - will be replaced with actual admin messages
  const updates: Update[] = [
    {
      id: 1,
      title: "New Products Added",
      message: "We've added 50+ new pharmaceutical products to our catalog. Check out the latest additions in the Featured Products section!",
      date: "2025-10-06",
      type: "success",
      isNew: true
    },
    {
      id: 2,
      title: "Delivery Time Improvement",
      message: "Great news! Our average delivery time has been reduced to 1.5 hours. Faster service for all our valued customers.",
      date: "2025-10-05",
      type: "info",
      isNew: true
    },
    {
      id: 3,
      title: "System Maintenance Notice",
      message: "Scheduled maintenance on October 10th from 2 AM to 4 AM. The platform may be temporarily unavailable during this time.",
      date: "2025-10-04",
      type: "warning",
      isNew: false
    },
    {
      id: 4,
      title: "Price Updates",
      message: "Monthly price updates have been applied. Please review the updated prices for accuracy.",
      date: "2025-10-01",
      type: "info",
      isNew: false
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white py-8 px-4 shadow-md">
        <div className="container mx-auto">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">Updates & Announcements</h1>
              <p className="text-white/90 mt-1">Stay informed about the latest news</p>
            </div>
          </div>
        </div>
      </div>

      {/* Updates List */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {updates.map((update) => (
            <Card 
              key={update.id} 
              className="p-5 hover:shadow-lg transition-all duration-300 border-2"
            >
              <div className="flex items-start gap-4">
                <div className={`rounded-full p-3 ${getTypeColor(update.type).split(' ')[0]}`}>
                  <span className="text-2xl">{getTypeIcon(update.type)}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {update.title}
                    </h3>
                    {update.isNew && (
                      <Badge className="bg-red-500 text-white">NEW</Badge>
                    )}
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    {update.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(update.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {updates.length === 0 && (
          <div className="text-center py-16">
            <Info className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Updates Yet
            </h3>
            <p className="text-muted-foreground">
              Check back later for announcements and updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Updates;
