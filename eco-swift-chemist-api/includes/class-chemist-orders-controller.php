<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Chemist_Orders_Controller extends \WP_REST_Controller {
    
    const NAMESPACE = 'eco-swift/v1';

    public function register_routes(): void {
        // Create Order
        register_rest_route(self::NAMESPACE, '/orders', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'create_order'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'line_items'   => ['required' => true, 'type' => 'array'],
                'billing'      => ['required' => true, 'type' => 'object'],
                'shipping'     => ['required' => false, 'type' => 'object'],
                'device_type'  => ['required' => false, 'type' => 'string'],
                'payment_method' => ['required' => false, 'type' => 'string'],
                'payment_method_title' => ['required' => false, 'type' => 'string'],
                'status'       => ['required' => false, 'type' => 'string'],
                'meta_data'    => ['required' => false, 'type' => 'array'],
            ],
        ]);

        // Get Orders (filtered by chemist)
        register_rest_route(self::NAMESPACE, '/orders', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_orders'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'page'     => ['type' => 'integer', 'default' => 1],
                'per_page' => ['type' => 'integer', 'default' => 10],
                'status'   => ['type' => 'string'],
            ],
        ]);

        // Get Single Order
        register_rest_route(self::NAMESPACE, '/orders/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_order'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        // Update Order Status (limited to certain statuses)
        register_rest_route(self::NAMESPACE, '/orders/(?P<id>\d+)/status', [
            'methods'             => \WP_REST_Server::EDITABLE,
            'callback'            => [$this, 'update_order_status'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id'     => ['required' => true, 'type' => 'integer'],
                'status' => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // Test endpoint for debugging order creation issues
        register_rest_route(self::NAMESPACE, '/orders/test', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'test_order_creation'],
            'permission_callback' => [$this, 'check_auth_permission'],
        ]);
    }

    public function create_order(\WP_REST_Request $request) {
        try {
            error_log('Order creation started');
            
            // Ensure WooCommerce is loaded
            if (!function_exists('wc_create_order')) {
                return new \WP_Error('woocommerce_not_available', 'WooCommerce is not available', ['status' => 500]);
            }
            
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $line_items = $request->get_param('line_items');
            $billing = $request->get_param('billing');
            $shipping = $request->get_param('shipping') ?: $billing;
            $device_type = $request->get_param('device_type') ?: 'mobile';
            
            // Validate required data
            if (empty($line_items) || !is_array($line_items)) {
                return new \WP_Error('invalid_line_items', 'Line items are required', ['status' => 400]);
            }
            
            if (empty($billing) || empty($billing['email'])) {
                return new \WP_Error('invalid_billing', 'Billing information with email is required', ['status' => 400]);
            }

            // ============================================================
            // STEP 1: Create Order with Complete Information
            // ============================================================
            
            $order = wc_create_order([
                'customer_id' => $user->ID,
                'status' => 'pending',
                'created_via' => 'checkout'
            ]);

            if (is_wp_error($order)) {
                return $order;
            }
            
            error_log('Order created with ID: ' . $order->get_id());

            // ============================================================
            // STEP 2: Set Billing & Shipping IMMEDIATELY (Before Products)
            // ============================================================
            
            // Set billing address with all fields
            $order->set_billing_first_name($billing['first_name'] ?? '');
            $order->set_billing_last_name($billing['last_name'] ?? '');
            $order->set_billing_company($billing['company'] ?? '');
            $order->set_billing_address_1($billing['address_1'] ?? '');
            $order->set_billing_address_2($billing['address_2'] ?? '');
            $order->set_billing_city($billing['city'] ?? '');
            $order->set_billing_state($billing['state'] ?? '');
            $order->set_billing_postcode($billing['postcode'] ?? '');
            $order->set_billing_country($billing['country'] ?? 'IN');
            $order->set_billing_email($billing['email']); // Critical for customer emails
            $order->set_billing_phone($billing['phone'] ?? '');
            
            // Set shipping address
            $order->set_shipping_first_name($shipping['first_name'] ?? $billing['first_name'] ?? '');
            $order->set_shipping_last_name($shipping['last_name'] ?? $billing['last_name'] ?? '');
            $order->set_shipping_company($shipping['company'] ?? '');
            $order->set_shipping_address_1($shipping['address_1'] ?? $billing['address_1'] ?? '');
            $order->set_shipping_address_2($shipping['address_2'] ?? '');
            $order->set_shipping_city($shipping['city'] ?? $billing['city'] ?? '');
            $order->set_shipping_state($shipping['state'] ?? $billing['state'] ?? '');
            $order->set_shipping_postcode($shipping['postcode'] ?? $billing['postcode'] ?? '');
            $order->set_shipping_country($shipping['country'] ?? $billing['country'] ?? 'IN');

            foreach ($line_items as $item) {
                $product_id = intval($item['product_id']);
                $quantity = intval($item['quantity']);
                $variation_id = isset($item['variation_id']) ? intval($item['variation_id']) : 0;

                if ($quantity <= 0) {
                    $order->delete(true);
                    return new \WP_Error('invalid_quantity', 'Quantity must be greater than 0', ['status' => 400]);
                }

                $target_id = $variation_id ?: $product_id;
                $product = wc_get_product($target_id);
                
                if (!$product) {
                    $order->delete(true);
                    return new \WP_Error('invalid_product', "Product ID {$target_id} not found", ['status' => 400]);
                }

                if (!$product->is_purchasable()) {
                    $order->delete(true);
                    return new \WP_Error('product_not_purchasable', "Product {$product->get_name()} is not available for purchase", ['status' => 400]);
                }

                if (!$product->is_in_stock()) {
                    $order->delete(true);
                    return new \WP_Error('out_of_stock', "Product {$product->get_name()} is out of stock", ['status' => 400]);
                }
                
                if ($product->get_manage_stock() && $product->get_stock_quantity() < $quantity) {
                    $order->delete(true);
                    return new \WP_Error('insufficient_stock', "Insufficient stock for {$product->get_name()}. Available: {$product->get_stock_quantity()}, Requested: {$quantity}", ['status' => 400]);
                }

                $order->add_product($product, $quantity);
            }

            // ============================================================
            // STEP 4: Set Payment Method & Calculate Totals
            // ============================================================
            
            $order->set_payment_method('cod');
            $order->set_payment_method_title('Cash on Delivery');
            $order->calculate_totals();

            // ============================================================
            // STEP 5: Add Attribution Data
            // ============================================================
            
            $attribution_data = [
                'source_type'         => 'typein',
                'referrer'            => '(direct)',
                'utm_campaign'        => '(direct)',
                'utm_source'          => '(direct)',
                'utm_medium'          => '(direct)',
                'utm_content'         => '',
                'utm_id'              => '',
                'utm_term'            => '',
                'session_entry'       => esc_url(home_url('/')),
                'session_start_time'  => current_time('timestamp'),
                'session_pages'       => 1,
                'session_count'       => 1,
                'user_agent'          => 'EcoSwift-ChemistApp/1.0',
                'device_type'         => $device_type,
                'origin'              => 'direct',
            ];

            // Store individual attribution fields
            foreach ($attribution_data as $key => $value) {
                $order->update_meta_data('_wc_order_attribution_' . $key, $value);
            }
            
            // Store complete attribution array
            $order->update_meta_data('_wc_order_attribution_data', $attribution_data);
            
            // Add app-specific metadata
            $order->update_meta_data('_order_channel', 'mobile_app');
            $order->update_meta_data('_app_version', '1.0');
            $order->update_meta_data('_api_created', 'yes');
            $order->update_meta_data('_api_timestamp', current_time('mysql'));

            // ============================================================
            // STEP 6: Save Order ONCE with All Data
            // ============================================================
            
            $order->save();
            error_log('Order saved with all data. Order ID: ' . $order->get_id());

            // ============================================================
            // STEP 7: Add Order Note
            // ============================================================
            
            $customer_name = trim($billing['first_name'] . ' ' . $billing['last_name']);
            $shop_name = get_user_meta($user->ID, 'shop_name', true);
            $order->add_order_note("Order created via Eco Swift Chemist App by {$customer_name}" . 
                                   ($shop_name ? " from {$shop_name}" : ""));

            // ============================================================
            // STEP 8: Set Status to Processing (Triggers All Emails)
            // ============================================================
            
            // Setting status to 'processing' triggers both customer and admin/vendor emails
            // WooCommerce handles this automatically - no need for manual triggering
            $order->set_status('processing', 'Order received from mobile app');
            $order->save();
            
            error_log('Order status set to processing. All emails will trigger automatically.');

            // ============================================================
            // STEP 9: Trigger Analytics Hooks (Async - Don't Wait)
            // ============================================================
            
            do_action('woocommerce_new_order', $order->get_id(), $order);
            do_action('woocommerce_checkout_order_created', $order);
            do_action('woocommerce_api_create_order', $order->get_id(), $order, $request);
            
            // Trigger cashback system integration
            error_log('Orders Controller: Firing eco_swift_order_created hook for order #' . $order->get_id());
            do_action('eco_swift_order_created', $order->get_id(), [
                'order' => $order,
                'user_id' => $user->ID,
                'order_total' => $order->get_total()
            ]);
            error_log('Orders Controller: eco_swift_order_created hook fired successfully for order #' . $order->get_id());

            // ============================================================
            // STEP 10: Return Success Response IMMEDIATELY
            // ============================================================
            
            return rest_ensure_response([
                'success' => true,
                'data' => $this->format_order($order),
                'message' => 'Order created successfully'
            ]);

        } catch (Exception $e) {
            error_log('Order creation failed: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new \WP_Error('order_creation_failed', 'Failed to create order: ' . $e->getMessage(), ['status' => 500]);
        }
    }


    public function get_orders(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $page = $request->get_param('page');
            $per_page = min($request->get_param('per_page'), 50);
            $status = $request->get_param('status');

            $args = [
                'customer_id' => $user->ID,
                'limit' => $per_page,
                'offset' => ($page - 1) * $per_page,
                'orderby' => 'date',
                'order' => 'DESC'
            ];

            if ($status) {
                $args['status'] = sanitize_text_field($status);
            }

            $orders = wc_get_orders($args);
            $formatted_orders = [];

            foreach ($orders as $order) {
                $formatted_orders[] = $this->format_order($order);
            }

            // Get total count for pagination
            $total_args = $args;
            unset($total_args['limit'], $total_args['offset']);
            $total_orders = count(wc_get_orders($total_args));

            return rest_ensure_response([
                'success' => true,
                'data' => $formatted_orders,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $per_page,
                    'total_items' => $total_orders,
                    'total_pages' => ceil($total_orders / $per_page),
                    'has_more' => $page < ceil($total_orders / $per_page)
                ]
            ]);

        } catch (Exception $e) {
            return new \WP_Error('orders_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function get_order(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $order_id = $request->get_param('id');
            $order = wc_get_order($order_id);

            if (!$order) {
                return new \WP_Error('order_not_found', 'Order not found', ['status' => 404]);
            }

            // Check if order belongs to current user
            if ($order->get_customer_id() !== $user->ID) {
                return new \WP_Error('access_denied', 'Access denied', ['status' => 403]);
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $this->format_order($order, true) // Include full details
            ]);

        } catch (Exception $e) {
            return new \WP_Error('order_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function update_order_status(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $order_id = $request->get_param('id');
            $new_status = sanitize_text_field($request->get_param('status'));

            $order = wc_get_order($order_id);
            if (!$order) {
                return new \WP_Error('order_not_found', 'Order not found', ['status' => 404]);
            }

            // Check if order belongs to current user
            if ($order->get_customer_id() !== $user->ID) {
                return new \WP_Error('access_denied', 'Access denied', ['status' => 403]);
            }

            // Only allow certain status changes by customers
            $allowed_statuses = ['cancelled'];
            if (!in_array($new_status, $allowed_statuses)) {
                return new \WP_Error('invalid_status', 'Status change not allowed', ['status' => 400]);
            }

            // Don't allow cancellation of completed orders
            if ($new_status === 'cancelled' && in_array($order->get_status(), ['completed', 'refunded'])) {
                return new \WP_Error('cannot_cancel', 'Cannot cancel completed or refunded orders', ['status' => 400]);
            }

            $order->update_status($new_status, 'Status changed via Eco Swift Chemist App');

            return rest_ensure_response([
                'success' => true,
                'data' => $this->format_order($order),
                'message' => 'Order status updated successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('status_update_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    private function format_order($order, $full_details = false) {
        $line_items = [];
        foreach ($order->get_items() as $item_id => $item) {
            $product = $item->get_product();
            $product_image = null;
            
            if ($product) {
                $image_id = $product->get_image_id();
                if ($image_id) {
                    $product_image = wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail');
                }
            }

            // Get vendor information for the product
            $vendor_id = null;
            $vendor_name = 'Unknown';
            $vendor_email = '';
            
            if ($product) {
                // Try to get vendor from product meta first
                $vendor_id = get_post_meta($item->get_product_id(), '_vendor_id', true);
                
                // If not found in meta, try getting from product author (who created the product)
                if (!$vendor_id) {
                    $product_post = get_post($item->get_product_id());
                    if ($product_post) {
                        $vendor_id = $product_post->post_author;
                    }
                }
                
                if ($vendor_id) {
                    $vendor_user = get_userdata($vendor_id);
                    if ($vendor_user) {
                        $vendor_name = $vendor_user->display_name;
                        $vendor_email = $vendor_user->user_email;
                        // Get shop name if available (Dokan/Vendor plugin)
                        $shop_name = get_user_meta($vendor_id, 'dokan_store_name', true);
                        if (!$shop_name) {
                            $shop_name = get_user_meta($vendor_id, 'shop_name', true);
                        }
                        if ($shop_name) {
                            $vendor_name = $shop_name;
                        }
                    }
                }
            }
            
            $line_items[] = [
                'id' => $item_id,
                'product_id' => $item->get_product_id(),
                'variation_id' => $item->get_variation_id(),
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'subtotal' => $item->get_subtotal(),
                'total' => $item->get_total(),
                'price' => $product ? $product->get_price() : 0,
                'image' => $product_image ? ['src' => $product_image] : null,
                'sku' => $product ? $product->get_sku() : '',
                'vendor_id' => $vendor_id,
                'vendor_name' => $vendor_name,
                'store_name' => $vendor_name, // Add store_name as alias
                'vendor_email' => $vendor_email
            ];
        }

        $formatted = [
            'id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'status_label' => wc_get_order_status_name($order->get_status()),
            'date_created' => $order->get_date_created()->date('Y-m-d H:i:s'),
            'date_modified' => $order->get_date_modified()->date('Y-m-d H:i:s'),
            'total' => $order->get_total(),
            'subtotal' => $order->get_subtotal(),
            'tax_total' => $order->get_total_tax(),
            'shipping_total' => $order->get_shipping_total(),
            'currency' => $order->get_currency(),
            'payment_method' => $order->get_payment_method(),
            'payment_method_title' => $order->get_payment_method_title(),
            'line_items' => $line_items,
            'billing' => [
                'first_name' => $order->get_billing_first_name(),
                'last_name' => $order->get_billing_last_name(),
                'company' => $order->get_billing_company(),
                'address_1' => $order->get_billing_address_1(),
                'address_2' => $order->get_billing_address_2(),
                'city' => $order->get_billing_city(),
                'state' => $order->get_billing_state(),
                'postcode' => $order->get_billing_postcode(),
                'country' => $order->get_billing_country(),
                'email' => $order->get_billing_email(),
                'phone' => $order->get_billing_phone()
            ],
            'shipping' => [
                'first_name' => $order->get_shipping_first_name(),
                'last_name' => $order->get_shipping_last_name(),
                'company' => $order->get_shipping_company(),
                'address_1' => $order->get_shipping_address_1(),
                'address_2' => $order->get_shipping_address_2(),
                'city' => $order->get_shipping_city(),
                'state' => $order->get_shipping_state(),
                'postcode' => $order->get_shipping_postcode(),
                'country' => $order->get_shipping_country()
            ]
        ];

        // Add full details if requested
        if ($full_details) {
            $formatted['customer_note'] = $order->get_customer_note();
            $formatted['order_notes'] = $this->get_order_notes($order);
            $formatted['meta_data'] = $order->get_meta_data();
        }

        return $formatted;
    }

    private function get_order_notes($order) {
        $notes = wc_get_order_notes([
            'order_id' => $order->get_id(),
            'order_by' => 'date_created',
            'order' => 'DESC'
        ]);

        $formatted_notes = [];
        foreach ($notes as $note) {
            $formatted_notes[] = [
                'id' => $note->id,
                'content' => $note->content,
                'customer_note' => $note->customer_note,
                'date_created' => $note->date_created->date('Y-m-d H:i:s')
            ];
        }

        return $formatted_notes;
    }

    public function check_auth_permission(\WP_REST_Request $request) {
        $token = $this->get_token_from_request($request);
        if (!$token) {
            return new \WP_Error('no_token', 'Authentication required', ['status' => 401]);
        }

        $user = Token_Service::get_user_from_token($token);
        if (!$user) {
            return new \WP_Error('invalid_token', 'Invalid token', ['status' => 401]);
        }

        // Check if user is a chemist
        $business_type = get_user_meta($user->ID, 'business_type', true);
        if ($business_type !== 'chemist') {
            return new \WP_Error('access_denied', 'Access denied. Only chemists allowed.', ['status' => 403]);
        }

        return true;
    }

    private function get_current_user(\WP_REST_Request $request) {
        $token = $this->get_token_from_request($request);
        if (!$token) {
            return null;
        }

        return Token_Service::get_user_from_token($token);
    }

    private function get_token_from_request(\WP_REST_Request $request) {
        $header = $request->get_header('Authorization');
        if ($header && stripos($header, 'Bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return null;
    }

    /**
     * Test endpoint to diagnose order creation issues
     */
    public function test_order_creation(\WP_REST_Request $request) {
        $diagnostics = [];
        
        try {
            // Test 1: Check WooCommerce availability
            $diagnostics['woocommerce_loaded'] = function_exists('wc_create_order');
            $diagnostics['wc_version'] = defined('WC_VERSION') ? WC_VERSION : 'not available';
            
            // Test 2: Check user authentication
            $user = $this->get_current_user($request);
            $diagnostics['user_authenticated'] = $user ? true : false;
            if ($user) {
                $diagnostics['user_id'] = $user->ID;
                $diagnostics['user_email'] = $user->user_email;
                $diagnostics['business_type'] = get_user_meta($user->ID, 'business_type', true);
            }
            
            // Test 3: Try creating a simple WooCommerce order
            if ($user && function_exists('wc_create_order')) {
                $test_order = wc_create_order([
                    'customer_id' => $user->ID,
                    'status' => 'pending',
                    'created_via' => 'test'
                ]);
                
                if (is_wp_error($test_order)) {
                    $diagnostics['test_order_error'] = $test_order->get_error_message();
                } else {
                    $diagnostics['test_order_created'] = true;
                    $diagnostics['test_order_id'] = $test_order->get_id();
                    // Clean up test order
                    $test_order->delete(true);
                    $diagnostics['test_order_cleaned'] = true;
                }
            }
            
            // Test 4: Check database connectivity
            global $wpdb;
            $diagnostics['database_connected'] = $wpdb->get_var("SELECT 1") === '1';
            
            return rest_ensure_response([
                'success' => true,
                'diagnostics' => $diagnostics,
                'message' => 'Diagnostic test completed'
            ]);
            
        } catch (Exception $e) {
            $diagnostics['exception'] = $e->getMessage();
            
            return rest_ensure_response([
                'success' => false,
                'diagnostics' => $diagnostics,
                'error' => $e->getMessage()
            ]);
        }
    }
}
