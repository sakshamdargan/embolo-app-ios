import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  Loader2, 
  Send, 
  Ticket, 
  ArrowLeft, 
  MessageSquare, 
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import axios from 'axios';

const FLUENT_API_BASE = 'https://embolo.in/wp-json/fluent/v1';

// Types
interface DateObject {
  date: string;
  timezone_type: number;
  timezone: string;
}

interface TicketReply {
  id: number;
  content: string;
  person_type: string | null;
  created_at: DateObject | string;
}

interface Ticket {
  id: number;
  title: string;
  subject?: string;
  status: string;
  created_at: DateObject | string;
  updated_at?: DateObject | string;
  replies?: TicketReply[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const RaiseTicket: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // State management
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch tickets on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchTickets();
    }
  }, [isAuthenticated, user]);

  // Auto-clear messages
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const validateWordPressUser = async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return false;
    }

    try {
      const response = await axios.get(`https://embolo.in/wp-json/wp/v2/users/${user.id}`);
      if (response.data && response.data.id) {
        return true;
      }
      toast.error('WordPress user not found. Please contact support.');
      return false;
    } catch (err: any) {
      if (err.response?.status === 404) {
        toast.error('Your user account is not registered in WordPress. Please contact support.');
        setError('User account not found in WordPress system. Please contact support.');
      } else {
        console.error('Error validating WordPress user:', err);
      }
      return false;
    }
  };

  const createCustomer = async () => {
    if (!user?.id || !user?.email) {
      toast.error('User information not available');
      return false;
    }

    const isValidUser = await validateWordPressUser();
    if (!isValidUser) {
      return false;
    }

    const nameParts = user.name?.split(' ') || ['', ''];
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    try {
      const response = await axios.post(`${FLUENT_API_BASE}/create-customer`, {
        user_id: user.id,
        email: user.email,
        first_name: firstName,
        last_name: lastName
      });

      if (response.data.success) {
        toast.success('Customer profile created successfully');
        return true;
      }
      toast.error(response.data.message || 'Failed to create customer profile');
      return false;
    } catch (err: any) {
      console.error('Error creating customer:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create customer profile';
      toast.error(errorMsg);
      setError(errorMsg);
      return false;
    }
  };

  const fetchTickets = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${FLUENT_API_BASE}/tickets`,
        { params: { user_id: user.id } }
      );
      
      console.log('Tickets API Response:', response.data);
      
      let ticketsData = [];
      if (response.data.success && response.data.data) {
        ticketsData = response.data.data;
      } else if (response.data.tickets) {
        ticketsData = response.data.tickets;
      } else if (Array.isArray(response.data)) {
        ticketsData = response.data;
      }
      
      setTickets(ticketsData);
      console.log('Loaded tickets:', ticketsData);
    } catch (err: any) {
      console.error('Error fetching tickets:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (retryCount = 0) => {
    if (!user?.id) {
      setError('Please log in to raise a ticket');
      toast.error('Please log in to raise a ticket');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post<ApiResponse<Ticket>>(
        `${FLUENT_API_BASE}/create-ticket`,
        {
          user_id: user.id,
          subject: subject.trim(),
          message: message.trim()
        }
      );
      
      console.log('Create Ticket API Response:', response.data);
      
      if (response.data.success || response.data.ticket || response.data.id) {
        toast.success('Ticket created successfully!');
        setSuccess('Ticket created successfully!');
        setSubject('');
        setMessage('');
        setView('list');
        await fetchTickets();
      } else {
        setError(response.data.message || 'Failed to create ticket');
        toast.error(response.data.message || 'Failed to create ticket');
      }
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.message;

      if ((errorCode === 'invalid_customer' || errorMessage?.includes('Customer not found')) && retryCount === 0) {
        toast.info('Customer profile not found. Creating profile...');
        const customerCreated = await createCustomer();
        
        if (customerCreated) {
          await createTicket(1);
          return;
        } else {
          setError('Unable to create customer profile. Please contact support.');
          toast.error('Unable to create customer profile. Please contact support.');
        }
      } else {
        setError(errorMessage || 'Failed to create ticket. Please try again.');
        toast.error(errorMessage || 'Failed to create ticket. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${FLUENT_API_BASE}/ticket/${ticketId}`
      );
      
      console.log('Ticket Details API Response:', response.data);
      
      if (response.data.ticket) {
        const ticketWithReplies = {
          ...response.data.ticket,
          replies: response.data.replies || []
        };
        setSelectedTicket(ticketWithReplies);
        setView('detail');
        console.log('Loaded ticket with replies:', ticketWithReplies);
      } else {
        setError('Failed to load ticket details');
        toast.error('Failed to load ticket details');
      }
    } catch (err: any) {
      console.error('Error fetching ticket details:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load ticket details. Please try again.');
      toast.error(err.response?.data?.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const replyToTicket = async (retryCount = 0) => {
    if (!user?.id) {
      setError('Please log in to reply to a ticket');
      toast.error('Please log in to reply to a ticket');
      return;
    }

    if (!selectedTicket || !replyMessage.trim()) {
      setError('Please enter a reply message');
      toast.error('Please enter a reply message');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await axios.post<ApiResponse<TicketReply>>(
        `${FLUENT_API_BASE}/ticket/${selectedTicket.id}/reply`,
        {
          user_id: user.id,
          message: replyMessage.trim()
        }
      );
      
      console.log('Reply API Response:', response.data);
      
      if (response.data.success || response.data.reply || response.data.id) {
        toast.success('Reply added successfully!');
        setSuccess('Reply sent successfully!');
        setReplyMessage('');
        await fetchTicketDetails(selectedTicket.id);
      } else {
        setError(response.data.message || 'Failed to send reply');
        toast.error(response.data.message || 'Failed to send reply');
      }
    } catch (err: any) {
      console.error('Error replying to ticket:', err);
      const errorCode = err.response?.data?.code;
      const errorMessage = err.response?.data?.message;

      if ((errorCode === 'invalid_customer' || errorMessage?.includes('Customer not found')) && retryCount === 0) {
        toast.info('Customer profile not found. Creating profile...');
        const customerCreated = await createCustomer();
        
        if (customerCreated) {
          await replyToTicket(1);
          return;
        } else {
          setError('Unable to create customer profile. Please contact support.');
          toast.error('Unable to create customer profile. Please contact support.');
        }
      } else {
        setError(errorMessage || 'Failed to send reply. Please try again.');
        toast.error(errorMessage || 'Failed to send reply. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Helper Functions
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open' || statusLower === 'active') return 'bg-green-500';
    if (statusLower === 'pending') return 'bg-yellow-500';
    if (statusLower === 'closed') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'open' || statusLower === 'active') return <CheckCircle2 className="w-3 h-3" />;
    if (statusLower === 'pending') return <Clock className="w-3 h-3" />;
    if (statusLower === 'closed') return <XCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const formatDate = (dateInput: DateObject | string) => {
    try {
      let dateString: string;
      
      if (typeof dateInput === 'object' && dateInput.date) {
        dateString = dateInput.date;
      } else if (typeof dateInput === 'string') {
        dateString = dateInput;
      } else {
        return 'Invalid date';
      }
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <Card className="rounded-lg border border-gray-200 shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="bg-[#00aa63] bg-opacity-10 p-4 rounded-full inline-flex mb-4">
            <Ticket className="w-8 h-8 text-[#00aa63]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Login Required
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Please log in to raise a support ticket and view your tickets.
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-[#00aa63] hover:bg-[#009955] text-white"
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Create Ticket View
  if (view === 'create') {
    return (
      <Card className="rounded-lg border border-gray-200 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-200 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <div className="bg-[#00aa63] p-1.5 rounded">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              Create New Ticket
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('list')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
              Subject *
            </Label>
            <Input
              id="subject"
              type="text"
              placeholder="Brief description of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">
              Message *
            </Label>
            <Textarea
              id="message"
              placeholder="Describe your issue in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full min-h-[150px]"
              disabled={submitting}
            />
          </div>

          <Button
            onClick={() => createTicket()}
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full bg-[#00aa63] hover:bg-[#009955] text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Ticket...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Create Ticket
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Ticket Detail View
  if (view === 'detail' && selectedTicket) {
    return (
      <Card className="rounded-lg border border-gray-200 shadow-sm">
        <CardHeader className="bg-white border-b border-gray-200 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-base font-semibold">
              <div className="bg-[#00aa63] p-1.5 rounded">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              Ticket #{selectedTicket.id}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setView('list');
                setSelectedTicket(null);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Ticket Header */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selectedTicket.title || selectedTicket.subject}</h3>
              <Badge className={`${getStatusColor(selectedTicket.status)} text-white flex items-center gap-1`}>
                {getStatusIcon(selectedTicket.status)}
                {selectedTicket.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              Created: {formatDate(selectedTicket.created_at)}
            </div>
          </div>

          {/* Replies */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Conversation</h4>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#00aa63]" />
              </div>
            ) : selectedTicket.replies && selectedTicket.replies.length > 0 ? (
              <div className="space-y-3">
                {selectedTicket.replies.map((reply) => {
                  const isCustomer = reply.person_type === 'customer';
                  const isAdmin = reply.person_type === 'admin' || reply.person_type === 'agent';
                  
                  return (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg ${
                        isCustomer
                          ? 'bg-blue-50 border border-blue-100 ml-0 mr-8'
                          : isAdmin
                          ? 'bg-green-50 border border-green-100 ml-8 mr-0'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`p-1 rounded-full ${
                            isCustomer ? 'bg-blue-500' : isAdmin ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                        >
                          <UserIcon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-700">
                          {isCustomer ? 'You' : isAdmin ? 'Support Team' : 'System'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.created_at)}
                        </span>
                      </div>
                      <div 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: reply.content.replace(/<p>/g, '').replace(/<\/p>/g, '') }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No replies yet</p>
            )}
          </div>

          {/* Reply Form */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <Label htmlFor="reply" className="text-sm font-medium text-gray-700">
              Add Reply
            </Label>
            <Textarea
              id="reply"
              placeholder="Type your reply here..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="w-full min-h-[100px]"
              disabled={submitting}
            />
            <Button
              onClick={() => replyToTicket()}
              disabled={submitting || !replyMessage.trim()}
              className="w-full bg-[#00aa63] hover:bg-[#009955] text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Reply...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tickets List View (Default)
  return (
    <Card className="rounded-lg border border-gray-200 shadow-sm">
      <CardHeader className="bg-white border-b border-gray-200 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900 text-base font-semibold">
            <div className="bg-[#00aa63] p-1.5 rounded">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            My Support Tickets
          </CardTitle>
          <Button
            onClick={() => setView('create')}
            size="sm"
            className="bg-[#00aa63] hover:bg-[#009955] text-white"
          >
            <Ticket className="w-4 h-4 mr-1" />
            New Ticket
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {success && (
          <Alert className="bg-green-50 border-green-200 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00aa63]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-100 p-4 rounded-full inline-flex mb-4">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              No Tickets Yet
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You haven't created any support tickets yet.
            </p>
            <Button
              onClick={() => setView('create')}
              className="bg-[#00aa63] hover:bg-[#009955] text-white"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => fetchTicketDetails(ticket.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#00aa63] hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">
                    {ticket.title || ticket.subject}
                  </h3>
                  <Badge className={`${getStatusColor(ticket.status)} text-white flex items-center gap-1 ml-2`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(ticket.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Ticket #{ticket.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RaiseTicket;
