<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Chemist_Auth_Controller {
    const NAMESPACE = 'eco-swift/v1';

    public function register_routes(): void {
        // OTP Request for Login
        register_rest_route(self::NAMESPACE, '/auth/request-otp', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'request_login_otp'],
            'permission_callback' => '__return_true',
            'args'                => [
                'username' => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // OTP Request for Registration
        register_rest_route(self::NAMESPACE, '/auth/register-otp', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'request_register_otp'],
            'permission_callback' => '__return_true',
            'args'                => [
                'phone' => ['required' => true, 'type' => 'string'],
                'email' => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // Login with OTP
        register_rest_route(self::NAMESPACE, '/auth/login', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'login'],
            'permission_callback' => '__return_true',
            'args'                => [
                'username' => ['required' => true, 'type' => 'string'],
                'otp'      => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // Register with OTP
        register_rest_route(self::NAMESPACE, '/auth/register', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'register'],
            'permission_callback' => '__return_true',
            'args'                => [
                'phone'             => ['required' => true, 'type' => 'string'],
                'email'             => ['required' => true, 'type' => 'string'],
                'otp'               => ['required' => true, 'type' => 'string'],
                'shop_name'         => ['required' => true, 'type' => 'string'],
                'owner_first_name'  => ['required' => true, 'type' => 'string'],
                'owner_last_name'   => ['required' => true, 'type' => 'string'],
                'business_type'     => ['required' => true, 'type' => 'string'],
                'license_data'      => ['required' => false, 'type' => 'object'],
            ],
        ]);

        // Token Validation
        register_rest_route(self::NAMESPACE, '/auth/validate', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'validate_token'],
            'permission_callback' => '__return_true',
        ]);

        // Token Refresh
        register_rest_route(self::NAMESPACE, '/auth/refresh', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [$this, 'refresh_token'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function request_login_otp(\WP_REST_Request $request) {
        try {
            $username = sanitize_text_field($request->get_param('username'));
            
            // Determine if it's email or phone
            $user = null;
            $method = '';
            
            if (is_email($username)) {
                $user = get_user_by('email', $username);
                $method = 'email';
            } elseif (preg_match('/^\+91\d{10}$/', $username) || preg_match('/^\d{10}$/', $username)) {
                $phone = preg_match('/^\d{10}$/', $username) ? '+91' . $username : $username;
                $user = $this->get_user_by_phone($phone);
                $method = 'whatsapp';
            }
            
            if (!$user) {
                return new \WP_Error('user_not_found', 'User not found. Please register first.', ['status' => 404]);
            }

            // Check if user is a chemist
            $business_type = get_user_meta($user->ID, 'business_type', true);
            if ($business_type !== 'chemist') {
                return new \WP_Error('invalid_user_type', 'Access denied. Only chemists can use this app.', ['status' => 403]);
            }
            
            // Generate OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in transient (5 minutes)
            $transient_key = 'chemist_login_otp_' . md5($username);
            set_transient($transient_key, [
                'code' => $otp,
                'user_id' => $user->ID,
                'username' => $username
            ], 300);
            
            // Send OTP
            if ($method === 'email') {
                $subject = 'Your Embolo Login Code';
                $message = "Your login verification code is: $otp\nValid for 5 minutes";
                wp_mail($username, $subject, $message);
            } else {
                $result = send_gupshup_message_chemist($username, $otp);
                if (is_wp_error($result)) {
                    return $result;
                }
            }
            
            return rest_ensure_response([
                'success' => true,
                'message' => 'OTP sent successfully'
            ]);
            
        } catch (Exception $e) {
            return new \WP_Error('otp_request_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function request_register_otp(\WP_REST_Request $request) {
        try {
            $phone = sanitize_text_field($request->get_param('phone'));
            $email = sanitize_email($request->get_param('email'));
            
            // Validate phone format
            if (!preg_match('/^\+91\d{10}$/', $phone)) {
                return new \WP_Error('invalid_phone', 'Invalid phone number format', ['status' => 400]);
            }
            
            // Check if user already exists
            if (email_exists($email)) {
                return new \WP_Error('email_exists', 'Email already registered. Please login.', ['status' => 400]);
            }
            
            if ($this->get_user_by_phone($phone)) {
                return new \WP_Error('phone_exists', 'Phone number already registered. Please login.', ['status' => 400]);
            }
            
            // Generate OTP
            $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store OTP in transient (15 minutes)
            $transient_key = 'chemist_register_otp_' . md5($phone . $email);
            set_transient($transient_key, [
                'code' => $otp,
                'phone' => $phone,
                'email' => $email
            ], 900);
            
            // Send OTP via WhatsApp
            $result = send_gupshup_message_chemist($phone, $otp);
            if (is_wp_error($result)) {
                return $result;
            }
            
            return rest_ensure_response([
                'success' => true,
                'message' => 'OTP sent to WhatsApp'
            ]);
            
        } catch (Exception $e) {
            return new \WP_Error('otp_request_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function login(\WP_REST_Request $request) {
        try {
            $username = sanitize_text_field($request->get_param('username'));
            $otp = sanitize_text_field($request->get_param('otp'));
            
            // Get OTP from transient
            $transient_key = 'chemist_login_otp_' . md5($username);
            $otp_data = get_transient($transient_key);
            
            if (!$otp_data || $otp_data['code'] !== $otp) {
                return new \WP_Error('invalid_otp', 'Invalid or expired OTP', ['status' => 400]);
            }
            
            $user = get_user_by('id', $otp_data['user_id']);
            if (!$user) {
                return new \WP_Error('user_not_found', 'User not found', ['status' => 404]);
            }
            
            // Delete used OTP
            delete_transient($transient_key);
            
            // Generate JWT token
            $token = Token_Service::generate_token($user);
            
            return rest_ensure_response([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->ID,
                    'email' => $user->user_email,
                    'name' => $user->display_name,
                    'business_type' => get_user_meta($user->ID, 'business_type', true),
                    'shop_name' => get_user_meta($user->ID, 'shop_name', true)
                ]
            ]);
            
        } catch (Exception $e) {
            return new \WP_Error('login_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function register(\WP_REST_Request $request) {
        try {
            $phone = sanitize_text_field($request->get_param('phone'));
            $email = sanitize_email($request->get_param('email'));
            $otp = sanitize_text_field($request->get_param('otp'));
            $shop_name = sanitize_text_field($request->get_param('shop_name'));
            $owner_first_name = sanitize_text_field($request->get_param('owner_first_name'));
            $owner_last_name = sanitize_text_field($request->get_param('owner_last_name'));
            $business_type = sanitize_text_field($request->get_param('business_type'));
            $license_data = $request->get_param('license_data');
            
            // Validate OTP
            $transient_key = 'chemist_register_otp_' . md5($phone . $email);
            $otp_data = get_transient($transient_key);
            
            if (!$otp_data || $otp_data['code'] !== $otp) {
                return new \WP_Error('invalid_otp', 'Invalid or expired OTP', ['status' => 400]);
            }
            
            // Create user
            $username = sanitize_user(explode('@', $email)[0], true);
            $i = 1;
            while (username_exists($username)) {
                $username = sanitize_user(explode('@', $email)[0] . $i++, true);
            }
            
            $user_id = wp_create_user($username, wp_generate_password(), $email);
            if (is_wp_error($user_id)) {
                return $user_id;
            }
            
            // Update user meta
            wp_update_user([
                'ID' => $user_id,
                'first_name' => $owner_first_name,
                'last_name' => $owner_last_name,
                'display_name' => $owner_first_name . ' ' . $owner_last_name
            ]);
            
            update_user_meta($user_id, 'business_type', $business_type);
            update_user_meta($user_id, 'shop_name', $shop_name);
            update_user_meta($user_id, 'billing_phone', str_replace('+91', '', $phone));
            update_user_meta($user_id, 'billing_first_name', $owner_first_name);
            update_user_meta($user_id, 'billing_last_name', $owner_last_name);
            
            // Store license data if provided
            if ($license_data && is_array($license_data)) {
                foreach ($license_data as $key => $value) {
                    update_user_meta($user_id, $key, sanitize_text_field($value));
                }
            }
            
            // Delete used OTP
            delete_transient($transient_key);
            
            $user = get_user_by('id', $user_id);
            $token = Token_Service::generate_token($user);
            
            return rest_ensure_response([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user->ID,
                    'email' => $user->user_email,
                    'name' => $user->display_name,
                    'business_type' => $business_type,
                    'shop_name' => $shop_name
                ],
                'message' => 'Registration successful'
            ]);
            
        } catch (Exception $e) {
            return new \WP_Error('registration_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function validate_token(\WP_REST_Request $request) {
        $token = $this->get_token_from_request($request);
        if (!$token) {
            return new \WP_Error('no_token', 'No token provided', ['status' => 401]);
        }
        
        $payload = Token_Service::validate_token($token);
        if (!$payload) {
            return new \WP_Error('invalid_token', 'Invalid or expired token', ['status' => 401]);
        }
        
        return rest_ensure_response([
            'success' => true,
            'valid' => true,
            'user_id' => $payload->data->user->id
        ]);
    }

    public function refresh_token(\WP_REST_Request $request) {
        $token = $this->get_token_from_request($request);
        if (!$token) {
            return new \WP_Error('no_token', 'No token provided', ['status' => 401]);
        }
        
        $user = Token_Service::get_user_from_token($token);
        if (!$user) {
            return new \WP_Error('invalid_token', 'Invalid token', ['status' => 401]);
        }
        
        $new_token = Token_Service::generate_token($user);
        
        return rest_ensure_response([
            'success' => true,
            'token' => $new_token
        ]);
    }

    private function get_token_from_request(\WP_REST_Request $request) {
        $header = $request->get_header('Authorization');
        if ($header && stripos($header, 'Bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return null;
    }

    private function get_user_by_phone($phone) {
        $phone_without_prefix = preg_replace('/^\+91/', '', sanitize_text_field($phone));
        
        $user_query = new \WP_User_Query([
            'meta_key' => 'billing_phone',
            'meta_value' => $phone_without_prefix,
            'number' => 1,
            'count_total' => false,
            'fields' => 'all',
        ]);
        
        $users = $user_query->get_results();
        return !empty($users) ? $users[0] : false;
    }
}
