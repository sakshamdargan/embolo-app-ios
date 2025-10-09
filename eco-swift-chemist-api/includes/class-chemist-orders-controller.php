<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Chemist_Orders_Controller {
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
    }

    public function create_order(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $line_items = $request->get_param('line_items');
            $billing = $request->get_param('billing');
            $shipping = $request->get_param('shipping') ?: $billing;

            // Validate line items
            if (empty($line_items) || !is_array($line_items)) {
                return new \WP_Error('invalid_line_items', 'Line items are required', ['status' => 400]);
            }

            // Create WooCommerce order
            $order = wc_create_order([
                'customer_id' => $user->ID,
                'status' => 'processing',
                'created_via' => 'checkout'
            ]);

            if (is_wp_error($order)) {
                return $order;
            }

            // Add line items
            foreach ($line_items as $item) {
                $product_id = intval($item['product_id']);
                $quantity = intval($item['quantity']);
                $variation_id = isset($item['variation_id']) ? intval($item['variation_id']) : 0;

                $product = wc_get_product($variation_id ?: $product_id);
                if (!$product) {
                    $order->delete(true);
                    return new \WP_Error('invalid_product', "Product ID {$product_id} not found", ['status' => 400]);
                }

                // Check stock
                if (!$product->is_in_stock() || ($product->get_manage_stock() && $product->get_stock_quantity() < $quantity)) {
                    $order->delete(true);
                    return new \WP_Error('insufficient_stock', "Insufficient stock for {$product->get_name()}", ['status' => 400]);
                }

                $order->add_product($product, $quantity);
            }

            // Set billing address with proper validation
            if (!empty($billing)) {
                $order->set_address($billing, 'billing');
                // Ensure billing email is set for order emails
                if (!empty($billing['email'])) {
                    $order->set_billing_email($billing['email']);
                }
                if (!empty($billing['phone'])) {
                    $order->set_billing_phone($billing['phone']);
                }
            }
            
            // Set shipping address
            if (!empty($shipping)) {
                $order->set_address($shipping, 'shipping');
            }

            // Set payment method
            $order->set_payment_method('cod');
            $order->set_payment_method_title('Cash on Delivery');

            // Calculate totals
            $order->calculate_totals();

            // Save order first time
            $order->save();
            
            // Force update billing and shipping addresses again to ensure they're saved
            if (!empty($billing)) {
                $order->set_address($billing, 'billing');
                // Set individual billing fields to ensure they're saved
                if (isset($billing['first_name'])) $order->set_billing_first_name($billing['first_name']);
                if (isset($billing['last_name'])) $order->set_billing_last_name($billing['last_name']);
                if (isset($billing['email'])) $order->set_billing_email($billing['email']);
                if (isset($billing['phone'])) $order->set_billing_phone($billing['phone']);
                if (isset($billing['address_1'])) $order->set_billing_address_1($billing['address_1']);
                if (isset($billing['address_2'])) $order->set_billing_address_2($billing['address_2']);
                if (isset($billing['city'])) $order->set_billing_city($billing['city']);
                if (isset($billing['state'])) $order->set_billing_state($billing['state']);
                if (isset($billing['postcode'])) $order->set_billing_postcode($billing['postcode']);
                if (isset($billing['country'])) $order->set_billing_country($billing['country']);
            }
            
            if (!empty($shipping)) {
                $order->set_address($shipping, 'shipping');
                // Set individual shipping fields to ensure they're saved
                if (isset($shipping['first_name'])) $order->set_shipping_first_name($shipping['first_name']);
                if (isset($shipping['last_name'])) $order->set_shipping_last_name($shipping['last_name']);
                if (isset($shipping['address_1'])) $order->set_shipping_address_1($shipping['address_1']);
                if (isset($shipping['address_2'])) $order->set_shipping_address_2($shipping['address_2']);
                if (isset($shipping['city'])) $order->set_shipping_city($shipping['city']);
                if (isset($shipping['state'])) $order->set_shipping_state($shipping['state']);
                if (isset($shipping['postcode'])) $order->set_shipping_postcode($shipping['postcode']);
                if (isset($shipping['country'])) $order->set_shipping_country($shipping['country']);
            }
            
            // Save again to ensure addresses are properly stored
            $order->save();
            
            // Ensure customer information is properly set for emails
            if (!empty($billing['first_name']) || !empty($billing['last_name'])) {
                $customer_name = trim(($billing['first_name'] ?? '') . ' ' . ($billing['last_name'] ?? ''));
                if ($customer_name) {
                    $order->update_meta_data('_billing_full_name', $customer_name);
                    $order->update_meta_data('_customer_display_name', $customer_name);
                }
            }

            // Get device type from request, fallback to 'mobile'
            $device_type = $request->get_param('device_type') ?: 'mobile';

            // Set WooCommerce created_via to ensure proper origin detection
            $order->set_created_via('checkout');
            
            // ============================================================
            // CRITICAL: Proper WooCommerce Attribution Setup
            // ============================================================
            
            // Step 1: Build attribution data in the exact format WooCommerce expects
            $attribution_data = array(
                'source_type'         => 'typein',  // 'typein' = direct traffic
                'referrer'            => '(direct)',
                'utm_campaign'        => '(direct)',
                'utm_source'          => '(direct)',
                'utm_medium'          => '(direct)',
                'utm_content'         => '',
                'utm_id'              => '',
                'utm_term'            => '',
                'session_entry'       => esc_url( home_url( '/' ) ),
                'session_start_time'  => current_time( 'timestamp' ),
                'session_pages'       => 1,
                'session_count'       => 1,
                'user_agent'          => 'EcoSwift-ChemistApp/1.0',
                'device_type'         => $device_type, // 'mobile', 'tablet', or 'desktop'
                'origin'              => 'direct',
            );

            // Step 2: Store attribution data using WooCommerce's internal method
            // This is the key - use update_meta_data with the exact key WC expects
            $order->update_meta_data( '_wc_order_attribution_source_type', $attribution_data['source_type'] );
            $order->update_meta_data( '_wc_order_attribution_referrer', $attribution_data['referrer'] );
            $order->update_meta_data( '_wc_order_attribution_utm_campaign', $attribution_data['utm_campaign'] );
            $order->update_meta_data( '_wc_order_attribution_utm_source', $attribution_data['utm_source'] );
            $order->update_meta_data( '_wc_order_attribution_utm_medium', $attribution_data['utm_medium'] );
            $order->update_meta_data( '_wc_order_attribution_utm_content', $attribution_data['utm_content'] );
            $order->update_meta_data( '_wc_order_attribution_utm_id', $attribution_data['utm_id'] );
            $order->update_meta_data( '_wc_order_attribution_utm_term', $attribution_data['utm_term'] );
            $order->update_meta_data( '_wc_order_attribution_session_entry', $attribution_data['session_entry'] );
            $order->update_meta_data( '_wc_order_attribution_session_start_time', $attribution_data['session_start_time'] );
            $order->update_meta_data( '_wc_order_attribution_session_pages', $attribution_data['session_pages'] );
            $order->update_meta_data( '_wc_order_attribution_session_count', $attribution_data['session_count'] );
            $order->update_meta_data( '_wc_order_attribution_user_agent', $attribution_data['user_agent'] );
            $order->update_meta_data( '_wc_order_attribution_device_type', $attribution_data['device_type'] );
            $order->update_meta_data( '_wc_order_attribution_origin', $attribution_data['origin'] );

            // Step 3: Store the complete attribution array (for backward compatibility)
            $order->update_meta_data( '_wc_order_attribution_data', $attribution_data );

            // Step 4: Add custom app-specific metadata
            $order->update_meta_data( '_order_channel', 'mobile_app' );
            $order->update_meta_data( '_app_version', '1.0' );
            $order->update_meta_data( '_api_created', 'yes' );
            $order->update_meta_data( '_api_timestamp', current_time( 'mysql' ) );
            $order->update_meta_data( '_created_via', 'checkout' );
            $order->update_meta_data( '_order_origin', 'direct' );
            $order->update_meta_data( '_order_source', 'web' );
            $order->update_meta_data( '_customer_user_agent', 'EcoSwift-ChemistApp/1.0' );
            
            // Save metadata
            $order->save_meta_data();
            
            // Final save to ensure all metadata is persisted
            $order->save();
            
            // Force WooCommerce to recognize this as a direct order
            add_filter('woocommerce_order_get_created_via', function($created_via, $order_obj) use ($order) {
                if ($order_obj->get_id() === $order->get_id()) {
                    return 'checkout';
                }
                return $created_via;
            }, 10, 2);

            // Final save to ensure all data is persisted before email triggers
            $order->save();
            
            // CRITICAL: Ensure all address data is saved before triggering emails
            // Force refresh the order object to ensure all data is loaded
            $order = wc_get_order($order->get_id());
            
            // Verify and re-set billing address if needed
            if (!empty($billing)) {
                // Double-check billing address is properly set
                if (empty($order->get_billing_first_name()) && !empty($billing['first_name'])) {
                    $order->set_billing_first_name($billing['first_name']);
                }
                if (empty($order->get_billing_last_name()) && !empty($billing['last_name'])) {
                    $order->set_billing_last_name($billing['last_name']);
                }
                if (empty($order->get_billing_email()) && !empty($billing['email'])) {
                    $order->set_billing_email($billing['email']);
                }
                if (empty($order->get_billing_phone()) && !empty($billing['phone'])) {
                    $order->set_billing_phone($billing['phone']);
                }
                if (empty($order->get_billing_address_1()) && !empty($billing['address_1'])) {
                    $order->set_billing_address_1($billing['address_1']);
                }
                if (empty($order->get_billing_city()) && !empty($billing['city'])) {
                    $order->set_billing_city($billing['city']);
                }
                if (empty($order->get_billing_state()) && !empty($billing['state'])) {
                    $order->set_billing_state($billing['state']);
                }
                if (empty($order->get_billing_postcode()) && !empty($billing['postcode'])) {
                    $order->set_billing_postcode($billing['postcode']);
                }
                if (empty($order->get_billing_country()) && !empty($billing['country'])) {
                    $order->set_billing_country($billing['country']);
                }
                
                // Save after setting billing fields
                $order->save();
            }
            
            // Add order note with customer and shop info
            $customer_name = get_user_meta($user->ID, 'billing_first_name', true) . ' ' . get_user_meta($user->ID, 'billing_last_name', true);
            $shop_name = get_user_meta($user->ID, 'shop_name', true);
            $order->add_order_note("Order created via Eco Swift Chemist App by {$customer_name} from {$shop_name}");
            
            // IMPORTANT: Don't use update_status with email trigger here
            // Set status without triggering emails first
            $order->set_status('processing');
            $order->save();
            
            // ============================================================
            // CRITICAL: Trigger WooCommerce Hooks for Analytics
            // ============================================================
            
            // This hook is essential - it tells WooCommerce to process the order for analytics
            do_action( 'woocommerce_new_order', $order->get_id(), $order );
            
            // This hook ensures attribution data is indexed for reporting
            do_action( 'woocommerce_checkout_order_created', $order );
            
            // Additional hook for order processing
            do_action( 'woocommerce_api_create_order', $order->get_id(), $order, $request );
            
            // ============================================================
            // NOW Trigger Email Hooks (after all data is confirmed saved)
            // ============================================================
            
            // Refresh order one more time to ensure all data is loaded for emails
            $order = wc_get_order($order->get_id());
            
            // Trigger order status change to processing WITH email notification
            $order->update_status('processing', 'Order created via Eco Swift Chemist App', true);
            
            // Additional email hooks for completeness
            do_action('woocommerce_checkout_order_processed', $order->get_id(), [], $order);
            
            // Trigger new order email specifically
            do_action('woocommerce_order_status_pending_to_processing', $order->get_id(), $order);

            return rest_ensure_response([
                'success' => true,
                'data' => $this->format_order($order),
                'message' => 'Order created successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('order_creation_failed', $e->getMessage(), ['status' => 500]);
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
                'sku' => $product ? $product->get_sku() : ''
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
}
