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
                'line_items' => ['required' => true, 'type' => 'array'],
                'billing'    => ['required' => true, 'type' => 'object'],
                'shipping'   => ['required' => false, 'type' => 'object'],
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
                'status' => 'pending'
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

            // Set billing address
            $order->set_address($billing, 'billing');
            
            // Set shipping address
            $order->set_address($shipping, 'shipping');

            // Set payment method
            $order->set_payment_method('cod');
            $order->set_payment_method_title('Cash on Delivery');

            // Calculate totals
            $order->calculate_totals();

            // Save order
            $order->save();

            // Add order note
            $order->add_order_note('Order created via Eco Swift Chemist App');

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
