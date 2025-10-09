<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Chemist_Address_Controller {
    const NAMESPACE = 'eco-swift/v1';

    public function register_routes(): void {
        // Get user addresses
        register_rest_route(self::NAMESPACE, '/addresses', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_addresses'],
            'permission_callback' => [$this, 'check_auth_permission'],
        ]);

        // Add new address
        register_rest_route(self::NAMESPACE, '/addresses', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'add_address'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'type'        => ['required' => true, 'type' => 'string'],
                'first_name'  => ['required' => true, 'type' => 'string'],
                'last_name'   => ['required' => true, 'type' => 'string'],
                'address_1'   => ['required' => true, 'type' => 'string'],
                'address_2'   => ['required' => false, 'type' => 'string'],
                'city'        => ['required' => true, 'type' => 'string'],
                'state'       => ['required' => true, 'type' => 'string'],
                'postcode'    => ['required' => true, 'type' => 'string'],
                'country'     => ['required' => false, 'type' => 'string'],
                'phone'       => ['required' => false, 'type' => 'string'],
                'is_default'  => ['required' => false, 'type' => 'boolean'],
            ],
        ]);

        // Update address
        register_rest_route(self::NAMESPACE, '/addresses/(?P<id>[a-zA-Z0-9_]+)', [
            'methods'             => \WP_REST_Server::EDITABLE,
            'callback'            => [$this, 'update_address'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id'          => ['required' => true, 'type' => 'string'],
                'type'        => ['required' => false, 'type' => 'string'],
                'first_name'  => ['required' => false, 'type' => 'string'],
                'last_name'   => ['required' => false, 'type' => 'string'],
                'address_1'   => ['required' => false, 'type' => 'string'],
                'address_2'   => ['required' => false, 'type' => 'string'],
                'city'        => ['required' => false, 'type' => 'string'],
                'state'       => ['required' => false, 'type' => 'string'],
                'postcode'    => ['required' => false, 'type' => 'string'],
                'country'     => ['required' => false, 'type' => 'string'],
                'phone'       => ['required' => false, 'type' => 'string'],
                'is_default'  => ['required' => false, 'type' => 'boolean'],
            ],
        ]);

        // Delete address
        register_rest_route(self::NAMESPACE, '/addresses/(?P<id>[a-zA-Z0-9_]+)', [
            'methods'             => \WP_REST_Server::DELETABLE,
            'callback'            => [$this, 'delete_address'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // Set default address
        register_rest_route(self::NAMESPACE, '/addresses/(?P<id>[a-zA-Z0-9_]+)/default', [
            'methods'             => \WP_REST_Server::EDITABLE,
            'callback'            => [$this, 'set_default_address'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id'   => ['required' => true, 'type' => 'string'],
                'type' => ['required' => true, 'type' => 'string'], // 'billing' or 'shipping'
            ],
        ]);
    }

    public function get_addresses(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $addresses = $this->get_user_addresses($user->ID);

            return rest_ensure_response([
                'success' => true,
                'data' => $addresses
            ]);

        } catch (Exception $e) {
            return new \WP_Error('addresses_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function add_address(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $address_data = [
                'type'        => sanitize_text_field($request->get_param('type')),
                'first_name'  => sanitize_text_field($request->get_param('first_name')),
                'last_name'   => sanitize_text_field($request->get_param('last_name')),
                'address_1'   => sanitize_text_field($request->get_param('address_1')),
                'address_2'   => sanitize_text_field($request->get_param('address_2')),
                'city'        => sanitize_text_field($request->get_param('city')),
                'state'       => sanitize_text_field($request->get_param('state')),
                'postcode'    => sanitize_text_field($request->get_param('postcode')),
                'country'     => sanitize_text_field($request->get_param('country')) ?: 'IN',
                'phone'       => sanitize_text_field($request->get_param('phone')),
                'is_default'  => $request->get_param('is_default') ?: false,
            ];

            // Validate required fields
            $required_fields = ['type', 'first_name', 'last_name', 'address_1', 'city', 'state', 'postcode'];
            foreach ($required_fields as $field) {
                if (empty($address_data[$field])) {
                    return new \WP_Error('missing_field', "Field '{$field}' is required", ['status' => 400]);
                }
            }

            // Validate address type
            if (!in_array($address_data['type'], ['billing', 'shipping'])) {
                return new \WP_Error('invalid_type', 'Address type must be billing or shipping', ['status' => 400]);
            }

            $address_id = $this->save_user_address($user->ID, $address_data);

            if ($address_data['is_default']) {
                $this->set_user_default_address($user->ID, $address_id, $address_data['type']);
            }

            $address = $this->get_user_address($user->ID, $address_id);

            return rest_ensure_response([
                'success' => true,
                'data' => $address,
                'message' => 'Address added successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('address_add_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function update_address(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $address_id = $request->get_param('id');
            $existing_address = $this->get_user_address($user->ID, $address_id);

            if (!$existing_address) {
                return new \WP_Error('address_not_found', 'Address not found', ['status' => 404]);
            }

            $address_data = [];
            $updatable_fields = ['type', 'first_name', 'last_name', 'address_1', 'address_2', 'city', 'state', 'postcode', 'country', 'phone', 'is_default'];
            
            foreach ($updatable_fields as $field) {
                $value = $request->get_param($field);
                if ($value !== null) {
                    $address_data[$field] = $field === 'is_default' ? (bool)$value : sanitize_text_field($value);
                }
            }

            if (isset($address_data['type']) && !in_array($address_data['type'], ['billing', 'shipping'])) {
                return new \WP_Error('invalid_type', 'Address type must be billing or shipping', ['status' => 400]);
            }

            $this->update_user_address($user->ID, $address_id, $address_data);

            if (isset($address_data['is_default']) && $address_data['is_default']) {
                $type = $address_data['type'] ?? $existing_address['type'];
                $this->set_user_default_address($user->ID, $address_id, $type);
            }

            $updated_address = $this->get_user_address($user->ID, $address_id);

            return rest_ensure_response([
                'success' => true,
                'data' => $updated_address,
                'message' => 'Address updated successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('address_update_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function delete_address(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $address_id = $request->get_param('id');
            $address = $this->get_user_address($user->ID, $address_id);

            if (!$address) {
                return new \WP_Error('address_not_found', 'Address not found', ['status' => 404]);
            }

            $this->delete_user_address($user->ID, $address_id);

            return rest_ensure_response([
                'success' => true,
                'message' => 'Address deleted successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('address_delete_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function set_default_address(\WP_REST_Request $request) {
        try {
            $user = $this->get_current_user($request);
            if (!$user) {
                return new \WP_Error('unauthorized', 'Authentication required', ['status' => 401]);
            }

            $address_id = $request->get_param('id');
            $type = sanitize_text_field($request->get_param('type'));

            if (!in_array($type, ['billing', 'shipping'])) {
                return new \WP_Error('invalid_type', 'Type must be billing or shipping', ['status' => 400]);
            }

            $address = $this->get_user_address($user->ID, $address_id);
            if (!$address) {
                return new \WP_Error('address_not_found', 'Address not found', ['status' => 404]);
            }

            $this->set_user_default_address($user->ID, $address_id, $type);

            return rest_ensure_response([
                'success' => true,
                'message' => 'Default address updated successfully'
            ]);

        } catch (Exception $e) {
            return new \WP_Error('default_address_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    private function get_user_addresses($user_id) {
        $addresses_data = get_user_meta($user_id, 'user_addresses', true);
        if (!$addresses_data || !is_array($addresses_data)) {
            return [];
        }

        $default_billing = get_user_meta($user_id, 'default_billing_address', true);
        $default_shipping = get_user_meta($user_id, 'default_shipping_address', true);

        $addresses = [];
        foreach ($addresses_data as $id => $address) {
            $address['id'] = $id;
            $address['is_default_billing'] = ($id == $default_billing);
            $address['is_default_shipping'] = ($id == $default_shipping);
            $addresses[] = $address;
        }

        return $addresses;
    }

    private function get_user_address($user_id, $address_id) {
        $addresses_data = get_user_meta($user_id, 'user_addresses', true);
        if (!$addresses_data || !isset($addresses_data[$address_id])) {
            return null;
        }

        $address = $addresses_data[$address_id];
        $address['id'] = $address_id;

        $default_billing = get_user_meta($user_id, 'default_billing_address', true);
        $default_shipping = get_user_meta($user_id, 'default_shipping_address', true);

        $address['is_default_billing'] = ($address_id == $default_billing);
        $address['is_default_shipping'] = ($address_id == $default_shipping);

        return $address;
    }

    private function save_user_address($user_id, $address_data) {
        $addresses_data = get_user_meta($user_id, 'user_addresses', true);
        if (!$addresses_data || !is_array($addresses_data)) {
            $addresses_data = [];
        }

        // Generate unique ID
        $address_id = uniqid('addr_');
        
        // Remove is_default from stored data
        unset($address_data['is_default']);
        
        $addresses_data[$address_id] = $address_data;
        update_user_meta($user_id, 'user_addresses', $addresses_data);

        return $address_id;
    }

    private function update_user_address($user_id, $address_id, $address_data) {
        $addresses_data = get_user_meta($user_id, 'user_addresses', true);
        if (!$addresses_data || !isset($addresses_data[$address_id])) {
            throw new Exception('Address not found');
        }

        // Remove is_default from stored data
        unset($address_data['is_default']);

        $addresses_data[$address_id] = array_merge($addresses_data[$address_id], $address_data);
        update_user_meta($user_id, 'user_addresses', $addresses_data);
    }

    private function delete_user_address($user_id, $address_id) {
        $addresses_data = get_user_meta($user_id, 'user_addresses', true);
        if (!$addresses_data || !isset($addresses_data[$address_id])) {
            throw new Exception('Address not found');
        }

        unset($addresses_data[$address_id]);
        update_user_meta($user_id, 'user_addresses', $addresses_data);

        // Clear default if this was the default address
        $default_billing = get_user_meta($user_id, 'default_billing_address', true);
        $default_shipping = get_user_meta($user_id, 'default_shipping_address', true);

        if ($default_billing == $address_id) {
            delete_user_meta($user_id, 'default_billing_address');
        }
        if ($default_shipping == $address_id) {
            delete_user_meta($user_id, 'default_shipping_address');
        }
    }

    private function set_user_default_address($user_id, $address_id, $type) {
        if ($type === 'billing') {
            update_user_meta($user_id, 'default_billing_address', $address_id);
        } elseif ($type === 'shipping') {
            update_user_meta($user_id, 'default_shipping_address', $address_id);
        }
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
