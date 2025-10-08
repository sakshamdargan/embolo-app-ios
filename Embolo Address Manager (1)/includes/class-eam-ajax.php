<?php
class EAM_Ajax {

    public function __construct() {
        add_action( 'wp_ajax_eam_save_address', [ $this, 'save_address' ] );
        add_action( 'wp_ajax_eam_delete_address', [ $this, 'delete_address' ] );
        add_action( 'wp_ajax_eam_get_user_addresses', [ $this, 'get_user_addresses' ] );
        add_action( 'wp_ajax_eam_save_address_from_checkout', [ $this, 'save_address_from_checkout' ] );
    }

    public function get_user_addresses() {
        error_log('EAM AJAX: get_user_addresses called');
        error_log('EAM AJAX: POST data: ' . print_r($_POST, true));
        
        if (!wp_verify_nonce($_POST['nonce'], 'eam_address_nonce')) {
            error_log('EAM AJAX: Nonce verification failed');
            wp_send_json_error(['message' => 'Security check failed.']);
        }
        
        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            wp_send_json_error( [ 'message' => 'You must be logged in.' ] );
        }

        $addresses = get_user_meta( $user_id, '_eam_shipping_addresses', true );
        if ( ! is_array( $addresses ) ) {
            $addresses = [];
        }
        $addresses = array_values($addresses);

        $all_user_meta = get_user_meta( $user_id );

        wp_send_json_success([
            'addresses' => $addresses,
            'count' => count($addresses),
            'user_id' => $user_id,
            'debug' => 'Addresses retrieved successfully',
            'all_meta_keys' => array_keys($all_user_meta)
        ]);
    }

    public function save_address() {
        check_ajax_referer( 'eam_address_nonce', 'nonce' );

        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            wp_send_json_error( [ 'message' => 'You must be logged in.' ] );
        }

        $address_data = isset( $_POST['address'] ) ? $_POST['address'] : [];
        $address_id = isset( $_POST['address_id'] ) ? sanitize_key( $_POST['address_id'] ) : 'new';

        $sanitized_address = [
            'first_name' => sanitize_text_field($address_data['first_name'] ?? ''),
            'last_name'  => sanitize_text_field($address_data['last_name'] ?? ''),
            'address_1'  => sanitize_text_field($address_data['address_1'] ?? ''),
            'address_2'  => sanitize_text_field($address_data['address_2'] ?? ''),
            'city'       => sanitize_text_field($address_data['city'] ?? ''),
            'state'      => sanitize_text_field($address_data['state'] ?? ''),
            'postcode'   => sanitize_text_field($address_data['postcode'] ?? ''),
            'country'    => 'IN',
            'phone'      => sanitize_text_field($address_data['phone'] ?? ''),
        ];

        $addresses = get_user_meta( $user_id, '_eam_shipping_addresses', true );
        if ( ! is_array( $addresses ) ) {
            $addresses = [];
        }

        if ( $address_id === 'new' || ! isset($addresses[$address_id]) ) {
            $addresses[] = $sanitized_address;
            $new_address_id = array_key_last($addresses);
        } else {
            $addresses[$address_id] = $sanitized_address;
            $new_address_id = $address_id;
        }

        update_user_meta( $user_id, '_eam_shipping_addresses', $addresses );

        wp_send_json_success([
            'message' => 'Address saved successfully!',
            'address' => $sanitized_address,
            'address_id' => $new_address_id,
            'debug' => 'Address saved and verified'
        ]);
    }
    
    public function save_address_from_checkout() {
        error_log('EAM AJAX: save_address_from_checkout called');
        error_log('EAM AJAX: POST data: ' . print_r($_POST, true));

        check_ajax_referer( 'eam_address_nonce', 'nonce' );

        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            error_log('EAM AJAX: User not logged in for save_address_from_checkout');
            wp_send_json_error( [ 'message' => 'You must be logged in.' ] );
        }

        $address_data = isset( $_POST['address'] ) ? (array) $_POST['address'] : [];

        $sanitized_address = [
            'first_name' => sanitize_text_field($address_data['first_name'] ?? ''),
            'last_name'  => sanitize_text_field($address_data['last_name'] ?? ''),
            'address_1'  => sanitize_text_field($address_data['address_1'] ?? ''),
            'address_2'  => sanitize_text_field($address_data['address_2'] ?? ''),
            'city'       => sanitize_text_field($address_data['city'] ?? ''),
            'state'      => sanitize_text_field($address_data['state'] ?? ''),
            'postcode'   => sanitize_text_field($address_data['postcode'] ?? ''),
            'country'    => 'IN',
            'phone'      => sanitize_text_field($address_data['phone'] ?? ''),
        ];

        $addresses = get_user_meta( $user_id, '_eam_shipping_addresses', true );
        if ( ! is_array( $addresses ) ) {
            $addresses = [];
        }

        $addresses[] = $sanitized_address;
        $new_address_id = array_key_last($addresses);

        update_user_meta( $user_id, '_eam_shipping_addresses', $addresses );

        wp_send_json_success([
            'message' => 'Address saved successfully!',
            'address' => $sanitized_address,
            'address_id' => $new_address_id,
            'debug' => 'Address saved and verified from checkout',
            // Return the updated list of addresses
            'addresses' => array_values($addresses)
        ]);
    }

    public function delete_address() {
        check_ajax_referer( 'eam_address_nonce', 'nonce' );
        
        $user_id = get_current_user_id();
        if ( ! $user_id ) {
            wp_send_json_error( [ 'message' => 'You must be logged in.' ] );
        }

        $address_id = isset( $_POST['address_id'] ) ? sanitize_key( $_POST['address_id'] ) : '';

        if ( $address_id === '' ) {
            wp_send_json_error( [ 'message' => 'Invalid Address ID.' ] );
        }

        $addresses = get_user_meta( $user_id, '_eam_shipping_addresses', true );
        if ( isset( $addresses[ $address_id ] ) ) {
            unset( $addresses[ $address_id ] );
            update_user_meta( $user_id, '_eam_shipping_addresses', $addresses );
            wp_send_json_success( [ 'message' => 'Address deleted.' ] );
        } else {
            wp_send_json_error( [ 'message' => 'Address not found.' ] );
        }
    }
}