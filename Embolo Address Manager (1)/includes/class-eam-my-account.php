<?php
class EAM_My_Account {
    public function __construct() {
        // Remove default address page content and add our own
        add_action('woocommerce_account_edit-address_endpoint', [ $this, 'remove_default_address_content' ], 5);
        add_action('woocommerce_account_edit-address_endpoint', [ $this, 'render_custom_address_manager' ], 10);
        
        // Change the endpoint title
        add_filter( 'woocommerce_endpoint_edit-address_title', [ $this, 'change_endpoint_title' ] );
    }

    public function remove_default_address_content() {
        remove_action('woocommerce_account_edit-address_endpoint', 'woocommerce_account_edit_address');
    }

    public function change_endpoint_title( $title ) {
        return __( 'Manage Shipping Addresses', 'embolo-address-manager' );
    }

    public function render_custom_address_manager() {
        $user_id = get_current_user_id();
        $addresses = get_user_meta( $user_id, '_eam_shipping_addresses', true );
        if ( ! is_array( $addresses ) ) {
            $addresses = [];
        }

        echo '<h2>Manage Your Shipping Addresses</h2>';
        echo '<p>Add, edit, or remove your chemist shop addresses here for a faster checkout.</p>';
        
        // Render existing addresses
        echo '<div id="eam-address-list">';
        if (!empty($addresses)) {
            // Use array_values to ensure keys are numeric and sequential for JS
            foreach (array_values($addresses) as $index => $address) {
                self::render_address_card($address, $index);
            }
        } else {
            echo '<div class="woocommerce-info">No shipping addresses have been saved yet.</div>';
        }
        echo '</div>';
        
        echo '<div style="margin-top: 30px;">';
        // The form is now hidden by default and shown by JS
        self::render_address_form();
        // The "Add New" button will trigger the form display
        echo '<button id="eam-add-new-address-btn" class="button">Add New Address</button>';
        echo '</div>';

    }
    
    public static function render_address_card($address, $index) {
        ?>
        <div class="eam-address-card" data-address-id="<?php echo esc_attr($index); ?>">
            <address>
                <strong><?php echo esc_html($address['first_name'] . ' ' . $address['last_name']); ?></strong><br>
                <?php echo esc_html($address['address_1']); ?><br>
                <?php if (!empty($address['address_2'])) echo esc_html($address['address_2']) . '<br>'; ?>
                <?php echo esc_html($address['city'] . ', ' . $address['state'] . ' ' . $address['postcode']); ?><br>
                Phone: <?php echo esc_html($address['phone']); ?>
            </address>
            <div class="eam-card-actions">
                <button class="button eam-edit-btn">Edit</button>
                <button class="button eam-delete-btn">Delete</button>
            </div>
        </div>
        <?php
    }

    public static function render_address_form() {
        $current_user = wp_get_current_user();
        ?>
        <form id="eam-address-form" class="eam-address-form" data-address-id="new" style="display:none; margin-bottom: 20px;">
            <div class="eam-map-container">
                <input id="eam-address-search" type="text" placeholder="Search for your chemist shop..." class="input-text" />
                <div id="eam-map" style="height: 300px; width: 100%; margin-top: 10px;"></div>
            </div>
            
            <p class="form-row form-row-first">
                <label>First Name</label>
                <input type="text" class="input-text" name="first_name" value="<?php echo esc_attr($current_user->first_name); ?>">
            </p>
            <p class="form-row form-row-last">
                <label>Last Name</label>
                <input type="text" class="input-text" name="last_name" value="<?php echo esc_attr($current_user->last_name); ?>">
            </p>
            <p class="form-row form-row-wide">
                <label>Phone</label>
                <input type="tel" class="input-text" name="phone" value="<?php echo esc_attr(get_user_meta($current_user->ID, 'billing_phone', true)); ?>">
            </p>
            <p class="form-row form-row-wide">
                <label>Street Address</label>
                <input type="text" class="input-text" name="address_1" placeholder="House number and street name">
            </p>
            <p class="form-row form-row-wide">
                <label>Apartment, landmark, etc. (optional)</label>
                <input type="text" class="input-text" name="address_2">
            </p>
            <p class="form-row form-row-first">
                <label>Town / City</label>
                <input type="text" class="input-text" name="city">
            </p>
             <p class="form-row form-row-last">
                <label>PIN Code</label>
                <input type="text" class="input-text" name="postcode">
            </p>
             <p class="form-row form-row-wide">
                <label>State</label>
                <input type="text" class="input-text" name="state">
            </p>
            
            <input type="hidden" name="country" value="IN">
            
            <p>
                <button type="submit" class="button">Save Address</button>
                <button type="button" class="button eam-cancel-edit-btn" style="display:none; margin-left: 10px;">Cancel</button>
            </p>
        </form>
        <?php
    }
}