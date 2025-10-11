<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Cashback_Controller extends \WP_REST_Controller {
    
    protected $namespace = 'embolo/v1';
    protected $rest_base = 'cashback';
    
    public function register_routes() {
        // Get cashback for specific order
        register_rest_route($this->namespace, '/' . $this->rest_base . '/order/(?P<order_id>\d+)', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_order_cashback'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'order_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
            ],
        ]);
        
        // Get cashback preview/estimate
        register_rest_route($this->namespace, '/' . $this->rest_base . '/preview', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_cashback_preview'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'order_value' => [
                    'required' => false,
                    'type' => 'number',
                    'default' => 0,
                    'sanitize_callback' => 'floatval',
                ],
            ],
        ]);
        
        // Get user's cashback history
        register_rest_route($this->namespace, '/' . $this->rest_base . '/history', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'get_cashback_history'],
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
                'status' => [
                    'required' => false,
                    'type' => 'string',
                    'enum' => ['processing', 'completed', 'rejected'],
                ],
            ],
        ]);
        
        // Process cashback for order (internal use)
        register_rest_route($this->namespace, '/' . $this->rest_base . '/process', [
            'methods' => \WP_REST_Server::CREATABLE,
            'callback' => [$this, 'process_cashback'],
            'permission_callback' => [$this, 'check_authentication'],
            'args' => [
                'order_id' => [
                    'required' => true,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'order_value' => [
                    'required' => false,
                    'type' => 'number',
                    'default' => 0,
                    'sanitize_callback' => 'floatval',
                ],
            ],
        ]);
        
        // Test endpoint to check if plugin is loaded (no auth required)
        register_rest_route($this->namespace, '/' . $this->rest_base . '/test', [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => [$this, 'test_plugin'],
            'permission_callback' => '__return_true', // No authentication required
        ]);
    }
    
    public function check_authentication($request) {
        // Use the same JWT authentication as eco-swift-chemist-api
        $token = $this->get_token_from_request($request);
        if (!$token) {
            error_log('Cashback API: No JWT token found in request headers');
            return new \WP_Error(
                'rest_no_token',
                \__('JWT Token not found in request. Please log in again.'),
                ['status' => 401]
            );
        }
        
        error_log('Cashback API: JWT token found, attempting validation');
        
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
            error_log('Cashback API: JWT token validation failed - token is invalid or expired');
            return new \WP_Error(
                'rest_token_invalid',
                \__('JWT Token is invalid or expired. Please log in again.'),
                ['status' => 403]
            );
        }
        
        error_log('Cashback API: JWT token validated successfully for user ID: ' . $payload->data->user->id);
        
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
                \__('Access denied. Only chemists can access cashback system.'),
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
    
    public function test_plugin($request) {
        return rest_ensure_response([
            'success' => true,
            'message' => 'Embolo Cashback Plugin is loaded and working!',
            'plugin_version' => EMBOLO_CASHBACK_VERSION,
            'timestamp' => current_time('mysql'),
            'classes_loaded' => [
                'Cashback_Logic' => class_exists('Embolo\Cashback\Cashback_Logic'),
                'Database' => class_exists('Embolo\Cashback\Database'),
                'Wallet_Manager' => class_exists('Embolo\Cashback\Wallet_Manager'),
                'Token_Service' => class_exists('EcoSwift\ChemistApi\Token_Service'),
            ]
        ]);
    }
    
    public function get_order_cashback($request) {
        $order_id = $request->get_param('order_id');
        $user_id = get_current_user_id();
        
        // Verify order belongs to user
        $order = wc_get_order($order_id);
        if (!$order || $order->get_customer_id() != $user_id) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to view this order\'s cashback.'),
                ['status' => 403]
            );
        }
        
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $cashback_table WHERE order_id = %d AND user_id = %d",
            $order_id,
            $user_id
        ));
        
        if (!$cashback) {
            return new \WP_Error(
                'cashback_not_found',
                __('No cashback found for this order.'),
                ['status' => 404]
            );
        }
        
        $response_data = [
            'id' => $cashback->id,
            'order_id' => $cashback->order_id,
            'amount' => (float) $cashback->cashback_amount,
            'status' => $cashback->status,
            'created_at' => $cashback->created_at,
            'approved_at' => $cashback->approved_at,
            'algorithm_data' => $cashback->algorithm_data ? json_decode($cashback->algorithm_data, true) : null,
        ];
        
        return rest_ensure_response($response_data);
    }
    
    public function get_cashback_preview($request) {
        $order_value = $request->get_param('order_value');
        $user_id = get_current_user_id();
        
        // Debug logging
        error_log('Cashback Preview API called - User ID: ' . $user_id . ', Order Value: ' . $order_value);
        
        try {
            // Check if required classes exist
            if (!class_exists('Embolo\Cashback\Cashback_Logic')) {
                error_log('Cashback_Logic class not found');
                return new \WP_Error(
                    'class_not_found',
                    __('Cashback_Logic class not found. Plugin may not be properly loaded.'),
                    ['status' => 500]
                );
            }
            
            if (!class_exists('Embolo\Cashback\Database')) {
                error_log('Database class not found');
                return new \WP_Error(
                    'class_not_found',
                    __('Database class not found. Plugin may not be properly loaded.'),
                    ['status' => 500]
                );
            }
            
            $preview = Cashback_Logic::get_cashback_preview($user_id, $order_value);
            
            error_log('Cashback preview calculated successfully: ' . json_encode($preview));
            
            return rest_ensure_response([
                'success' => true,
                'data' => $preview,
                'message' => 'Cashback preview calculated successfully'
            ]);
            
        } catch (\Exception $e) {
            error_log('Cashback preview error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new \WP_Error(
                'preview_calculation_failed',
                __('Failed to calculate cashback preview: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
    
    public function get_cashback_history($request) {
        $limit = $request->get_param('limit');
        $offset = $request->get_param('offset');
        $status = $request->get_param('status');
        $user_id = get_current_user_id();
        
        try {
            $history = Wallet_Manager::get_transaction_history($user_id, $limit, $offset);
            
            // Filter by status if provided
            if ($status) {
                $history = array_filter($history, function($transaction) use ($status) {
                    return $transaction['status'] === $status;
                });
                $history = array_values($history); // Re-index array
            }
            
            return rest_ensure_response([
                'success' => true,
                'data' => $history,
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                    'total' => count($history)
                ]
            ]);
            
        } catch (\Exception $e) {
            return new \WP_Error(
                'history_fetch_failed',
                __('Failed to fetch cashback history: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
    
    public function process_cashback($request) {
        $order_id = $request->get_param('order_id');
        $order_value = $request->get_param('order_value');
        $user_id = get_current_user_id();
        
        // Debug logging
        error_log('Cashback Process API called - User ID: ' . $user_id . ', Order ID: ' . $order_id . ', Order Value: ' . $order_value);
        
        // Check if required classes exist
        if (!class_exists('Embolo\Cashback\Cashback_Logic')) {
            error_log('Cashback_Logic class not found in process_cashback');
            return new \WP_Error(
                'class_not_found',
                __('Cashback_Logic class not found. Plugin may not be properly loaded.'),
                ['status' => 500]
            );
        }
        
        if (!class_exists('Embolo\Cashback\Wallet_Manager')) {
            error_log('Wallet_Manager class not found in process_cashback');
            return new \WP_Error(
                'class_not_found',
                __('Wallet_Manager class not found. Plugin may not be properly loaded.'),
                ['status' => 500]
            );
        }
        
        // Verify order belongs to user
        $order = wc_get_order($order_id);
        if (!$order || $order->get_customer_id() != $user_id) {
            error_log('Order verification failed - Order ID: ' . $order_id . ', User ID: ' . $user_id);
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to process cashback for this order.'),
                ['status' => 403]
            );
        }
        
        // Check if cashback already exists for this order
        global $wpdb;
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $existing_cashback = $wpdb->get_row($wpdb->prepare(
            "SELECT id FROM $cashback_table WHERE order_id = %d AND user_id = %d",
            $order_id,
            $user_id
        ));
        
        if ($existing_cashback) {
            return new \WP_Error(
                'cashback_already_exists',
                __('Cashback has already been processed for this order.'),
                ['status' => 409]
            );
        }
        
        try {
            // Calculate cashback
            $cashback_result = Cashback_Logic::calculate_cashback($user_id, $order_value);
            
            // Create cashback entry
            $cashback_id = Wallet_Manager::add_cashback(
                $user_id,
                $cashback_result['amount'],
                $order_id,
                $cashback_result['algorithm_data']
            );
            
            if (!$cashback_id) {
                throw new Exception('Failed to create cashback entry');
            }
            
            $response_data = [
                'success' => true,
                'data' => [
                    'cashback_id' => $cashback_id,
                    'amount' => $cashback_result['amount'],
                    'status' => 'processing',
                    'algorithm_data' => $cashback_result['algorithm_data']
                ],
                'message' => sprintf(
                    __('Cashback of ₹%.2f has been processed for your order!'),
                    $cashback_result['amount']
                )
            ];
            
            return rest_ensure_response($response_data);
            
        } catch (\Exception $e) {
            error_log('Embolo Cashback: Failed to process cashback for order ' . $order_id . ': ' . $e->getMessage());
            
            return new \WP_Error(
                'cashback_processing_failed',
                __('Failed to process cashback: ') . $e->getMessage(),
                ['status' => 500]
            );
        }
    }
}
