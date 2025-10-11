<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Wallet_Controller extends \WP_REST_Controller {
    
    protected $namespace = 'embolo/v1';
    protected $rest_base = 'wallet';
    
    public function register_routes() {
        // Get wallet details
        register_rest_route($this->namespace, '/' . $this->rest_base, [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_wallet'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
        
        // Get wallet transaction history
        register_rest_route($this->namespace, '/' . $this->rest_base . '/transactions', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_transactions'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'limit' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 20,
                    'sanitize_callback' => 'absint',
                ],
                'offset' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 0,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // Get wallet statistics
        register_rest_route($this->namespace, '/' . $this->rest_base . '/stats', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_wallet_stats'],
            'permission_callback' => [$this, 'check_authentication'],
        ]);
    }
    
    public function check_authentication($request) {
        // Use the same JWT authentication as eco-swift-chemist-api
        $token = $this->get_token_from_request($request);
        if (!$token) {
            return new \WP_Error(
                'rest_no_token',
                \__('JWT Token not found in request.'),
                ['status' => 401]
            );
        }
        
        // Validate token using eco-swift-chemist-api Token_Service
        if (!\class_exists('EcoSwift\\ChemistApi\\Token_Service')) {
            return new \WP_Error(
                'rest_token_service_unavailable',
                \__('JWT Token service unavailable. Please ensure eco-swift-chemist-api plugin is active.'),
                ['status' => 503]
            );
        }
        
        $payload = \EcoSwift\ChemistApi\Token_Service::validate_token($token);
        if (!$payload) {
            return new \WP_Error(
                'rest_token_invalid',
                \__('JWT Token is invalid or expired.'),
                ['status' => 403]
            );
        }
        
        // Check if user exists and is a chemist
        if (!isset($payload->data->user->id)) {
            return new \WP_Error(
                'rest_token_invalid',
                \__('JWT Token payload is invalid.'),
                ['status' => 403]
            );
        }
        
        $user = \get_user_by('id', $payload->data->user->id);
        if (!$user) {
            return new \WP_Error(
                'rest_user_not_found',
                \__('User not found.'),
                ['status' => 404]
            );
        }
        
        // Check if user is a chemist
        $business_type = \get_user_meta($user->ID, 'business_type', true);
        if ($business_type !== 'chemist') {
            return new \WP_Error(
                'rest_access_denied',
                \__('Access denied. Only chemists can access wallet system.'),
                ['status' => 403]
            );
        }
        
        // Set current user for the request
        \wp_set_current_user($user->ID);
        
        // Sliding session: Generate a new token for the response
        $new_token = \EcoSwift\ChemistApi\Token_Service::generate_token($user);
        if ($new_token) {
            // We'll set this in the response header later via a filter
            \add_filter('rest_post_dispatch', function($response, $handler, $request) use ($new_token) {
                if ($response instanceof \WP_REST_Response) {
                    $response->header('X-JWT-Token', $new_token);
                }
                return $response;
            }, 10, 3);
        }
        
        return true;
    }
    
    private function get_token_from_request($request) {
        $auth_header = $request->get_header('Authorization');
        
        if ($auth_header && \preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return $matches[1];
        }
        
        return false;
    }
    
    public function get_wallet($request) {
        $user_id = get_current_user_id();
        
        try {
            $wallet_details = Wallet_Manager::get_wallet_details($user_id);
            
            // Get recent transactions (last 5)
            $recent_transactions = Wallet_Manager::get_transaction_history($user_id, 5, 0);
            
            // Calculate streak milestones
            $streak_milestones = $this->calculate_streak_milestones($wallet_details['current_streak']);
            
            $response_data = [
                'success' => true,
                'data' => [
                    'balance' => $wallet_details['balance'],
                    'lifetime_earned' => $wallet_details['lifetime_earned'],
                    'total_orders' => $wallet_details['total_orders'],
                    'current_streak' => $wallet_details['current_streak'],
                    'longest_streak' => $wallet_details['longest_streak'],
                    'engagement_score' => $wallet_details['engagement_score'],
                    'last_order_date' => $wallet_details['last_order_date'],
                    'streak_start_date' => $wallet_details['streak_start_date'],
                    'streak_milestones' => $streak_milestones,
                    'recent_transactions' => $recent_transactions,
                ],
                'message' => 'Wallet details retrieved successfully'
            ];
            
            return rest_ensure_response($response_data);
            
        } catch (Exception $e) {
            return new \WP_Error(
                'wallet_fetch_failed',
                __('Failed to fetch wallet details: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
    
    public function get_transactions($request) {
        $limit = $request->get_param('limit');
        $offset = $request->get_param('offset');
        $user_id = get_current_user_id();
        
        try {
            $transactions = Wallet_Manager::get_transaction_history($user_id, $limit, $offset);
            
            // Get total count for pagination
            global $wpdb;
            $cashback_table = $wpdb->prefix . 'embolo_cashback';
            $total_count = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $cashback_table WHERE user_id = %d",
                $user_id
            ));
            
            $response_data = [
                'success' => true,
                'data' => $transactions,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'total' => (int) $total_count,
                    'has_more' => ($offset + $limit) < $total_count
                ]
            ];
            
            return rest_ensure_response($response_data);
            
        } catch (Exception $e) {
            return new \WP_Error(
                'transactions_fetch_failed',
                __('Failed to fetch transactions: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
    
    public function get_wallet_stats($request) {
        $user_id = get_current_user_id();
        
        try {
            $wallet_details = Wallet_Manager::get_wallet_details($user_id);
            
            // Calculate additional statistics
            global $wpdb;
            $cashback_table = $wpdb->prefix . 'embolo_cashback';
            
            $monthly_stats = $wpdb->get_results($wpdb->prepare(
                "SELECT 
                    DATE_FORMAT(created_at, '%%Y-%%m') as month,
                    COUNT(*) as transaction_count,
                    SUM(cashback_amount) as total_amount,
                    AVG(cashback_amount) as avg_amount
                 FROM $cashback_table 
                 WHERE user_id = %d 
                 AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                 GROUP BY DATE_FORMAT(created_at, '%%Y-%%m')
                 ORDER BY month DESC",
                $user_id
            ));
            
            $status_breakdown = $wpdb->get_results($wpdb->prepare(
                "SELECT 
                    status,
                    COUNT(*) as count,
                    SUM(cashback_amount) as total_amount
                 FROM $cashback_table 
                 WHERE user_id = %d 
                 GROUP BY status",
                $user_id
            ));
            
            // Format monthly stats
            $formatted_monthly = [];
            foreach ($monthly_stats as $stat) {
                $formatted_monthly[] = [
                    'month' => $stat->month,
                    'transaction_count' => (int) $stat->transaction_count,
                    'total_amount' => (float) $stat->total_amount,
                    'avg_amount' => (float) $stat->avg_amount,
                ];
            }
            
            // Format status breakdown
            $formatted_status = [];
            foreach ($status_breakdown as $stat) {
                $formatted_status[$stat->status] = [
                    'count' => (int) $stat->count,
                    'total_amount' => (float) $stat->total_amount,
                ];
            }
            
            $response_data = [
                'success' => true,
                'data' => [
                    'wallet_summary' => $wallet_details,
                    'monthly_stats' => $formatted_monthly,
                    'status_breakdown' => $formatted_status,
                    'performance_metrics' => [
                        'avg_cashback_per_order' => $wallet_details['total_orders'] > 0 
                            ? round($wallet_details['lifetime_earned'] / $wallet_details['total_orders'], 2) 
                            : 0,
                        'engagement_level' => $this->get_engagement_level($wallet_details['engagement_score']),
                        'streak_performance' => $this->get_streak_performance($wallet_details['current_streak'], $wallet_details['longest_streak']),
                    ]
                ]
            ];
            
            return rest_ensure_response($response_data);
            
        } catch (Exception $e) {
            return new \WP_Error(
                'stats_fetch_failed',
                __('Failed to fetch wallet statistics: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
    
    private function calculate_streak_milestones($current_streak) {
        $milestones = [
            ['days' => 5, 'reward' => '₹60', 'title' => 'Loyalty Bonus'],
            ['days' => 7, 'reward' => '₹45', 'title' => 'Weekly Warrior'],
            ['days' => 14, 'reward' => '₹55', 'title' => 'Fortnight Champion'],
            ['days' => 30, 'reward' => '₹60', 'title' => 'Monthly Master'],
            ['days' => 50, 'reward' => '₹60+', 'title' => 'Ultra Loyalty'],
        ];
        
        $result = [];
        foreach ($milestones as $milestone) {
            $result[] = [
                'days' => $milestone['days'],
                'reward' => $milestone['reward'],
                'title' => $milestone['title'],
                'achieved' => $current_streak >= $milestone['days'],
                'progress' => min(100, ($current_streak / $milestone['days']) * 100),
            ];
        }
        
        return $result;
    }
    
    private function get_engagement_level($score) {
        if ($score >= 9.0) return 'Exceptional';
        if ($score >= 8.0) return 'Excellent';
        if ($score >= 7.0) return 'Very Good';
        if ($score >= 6.0) return 'Good';
        if ($score >= 5.0) return 'Average';
        if ($score >= 3.0) return 'Below Average';
        return 'Poor';
    }
    
    private function get_streak_performance($current, $longest) {
        if ($current === $longest && $current >= 30) return 'Peak Performance';
        if ($current >= $longest * 0.8) return 'Strong Performance';
        if ($current >= $longest * 0.5) return 'Good Performance';
        if ($current >= $longest * 0.3) return 'Moderate Performance';
        return 'Building Momentum';
    }
}
