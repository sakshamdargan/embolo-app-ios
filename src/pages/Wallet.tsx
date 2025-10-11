import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet as WalletIcon, 
  TrendingUp, 
  Calendar, 
  Award, 
  History, 
  Filter,
  RefreshCw,
  Sparkles,
  Target,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet, useCashbackHistory } from '@/hooks/useCashback';
import cashbackService from '@/services/cashbackService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Wallet = () => {
  const navigate = useNavigate();
  const { walletDetails, loading: walletLoading, refreshWallet } = useWallet();
  const { transactions, loading: historyLoading, refresh: refreshHistory, hasMore, loadMore } = useCashbackHistory();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([refreshWallet(), refreshHistory()]),
      {
        loading: 'Refreshing wallet data...',
        success: 'Wallet data refreshed!',
        error: 'Failed to refresh wallet data',
      }
    );
  };

  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    refreshHistory(status === 'all' ? undefined : status);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  if (walletLoading && !walletDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-screen bg-background pb-20"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-green-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={walletLoading}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <motion.div variants={itemVariants} className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <WalletIcon className="w-8 h-8" />
              <h1 className="text-2xl font-bold">My Cashback Wallet</h1>
            </div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 15 }}
              className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-4"
            >
              <div className="text-4xl font-bold mb-2">
                ₹{walletDetails?.balance.toFixed(2) || '0.00'}
              </div>
              <div className="text-white/80 text-sm">Total Cashback Earned</div>
              {walletDetails?.pending_amount && walletDetails.pending_amount > 0 && (
                <div className="mt-2 text-white/70 text-xs">
                  + ₹{walletDetails.pending_amount.toFixed(2)} pending payment
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        {/* Simplified Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold">₹{walletDetails?.lifetime_earned.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-muted-foreground">Lifetime Earned</div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold">{walletDetails?.total_orders || 0}</div>
              <div className="text-xs text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Streak Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-orange-500" />
                    Streak Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-orange-500">
                        {walletDetails?.current_streak || 0} Days
                      </div>
                      <div className="text-sm text-muted-foreground">Current Streak</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {walletDetails?.longest_streak || 0} Days
                      </div>
                      <div className="text-sm text-muted-foreground">Personal Best</div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-lg">
                    <div className="text-sm font-medium text-orange-800 mb-1">
                      Keep it up! 🔥
                    </div>
                    <div className="text-xs text-orange-600">
                      Order consistently to maintain your streak and earn higher rewards!
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" />
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {walletDetails?.recent_transactions && walletDetails.recent_transactions.length > 0 ? (
                    <div className="space-y-3">
                      {walletDetails.recent_transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">Order #{transaction.order_id}</div>
                            <div className="text-sm text-muted-foreground">
                              {cashbackService.formatDate(transaction.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              +₹{transaction.amount.toFixed(2)}
                            </div>
                            <Badge 
                              variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                              className={`text-xs ${cashbackService.getStatusColor(transaction.status)}`}
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions yet</p>
                      <p className="text-sm">Start ordering to earn cashback!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-500" />
                      Transaction History
                    </CardTitle>
                    <Select value={statusFilter} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-32">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactions && transactions.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.map((transaction) => (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Order #{transaction.order_id}</span>
                              <Badge 
                                variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                                className={`text-xs ${cashbackService.getStatusColor(transaction.status)}`}
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {cashbackService.formatDate(transaction.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 text-lg">
                              +₹{transaction.amount.toFixed(2)}
                            </div>
                            {transaction.approved_at && (
                              <div className="text-xs text-muted-foreground">
                                Approved {cashbackService.formatDate(transaction.approved_at)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      {hasMore && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={loadMore}
                            disabled={historyLoading}
                            className="w-full"
                          >
                            {historyLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Load More
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transactions found</p>
                      <p className="text-sm">
                        {statusFilter === 'all' 
                          ? 'Start ordering to earn cashback!' 
                          : `No ${statusFilter} transactions found`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    Streak Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {walletDetails?.streak_milestones ? (
                    <div className="space-y-4">
                      {walletDetails.streak_milestones.map((milestone, index) => (
                        <motion.div
                          key={milestone.days}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            milestone.achieved 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                milestone.achieved 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-300 text-gray-600'
                              }`}>
                                {milestone.achieved ? '✓' : milestone.days}
                              </div>
                              <div>
                                <div className="font-medium">{milestone.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {milestone.days} day streak
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{milestone.reward}</div>
                              <div className="text-xs text-muted-foreground">Reward</div>
                            </div>
                          </div>
                          
                          {!milestone.achieved && (
                            <div className="mt-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{milestone.progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  className="bg-primary h-2 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${milestone.progress}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Milestones loading...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Wallet;
