<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Email_Manager {
    
    public static function send_cashback_approved_email($user_id, $amount, $order_id) {
        $user = get_user_by('id', $user_id);
        if (!$user) {
            return false;
        }
        
        $order = wc_get_order($order_id);
        $subject = sprintf(__('Cashback Approved - ₹%.2f credited to your wallet!'), $amount);
        
        $message = self::get_cashback_approved_email_template($user, $amount, $order);
        
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>'
        ];
        
        return wp_mail($user->user_email, $subject, $message, $headers);
    }
    
    public static function send_cashback_processed_email($user_id, $amount, $order_id) {
        $user = get_user_by('id', $user_id);
        if (!$user) {
            return false;
        }
        
        $order = wc_get_order($order_id);
        $subject = sprintf(__('Cashback Earned - ₹%.2f for Order #%s'), $amount, $order->get_order_number());
        
        $message = self::get_cashback_processed_email_template($user, $amount, $order);
        
        $headers = [
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . get_bloginfo('name') . ' <' . get_option('admin_email') . '>'
        ];
        
        return wp_mail($user->user_email, $subject, $message, $headers);
    }
    
    private static function get_cashback_approved_email_template($user, $amount, $order) {
        $site_name = get_bloginfo('name');
        $site_url = home_url();
        $wallet_url = $site_url . '/wallet'; // Adjust based on your wallet page URL
        
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cashback Approved</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #00a651, #00c766); padding: 30px 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .cashback-amount { background: linear-gradient(135deg, #00a651, #00c766); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .cashback-amount .amount { font-size: 36px; font-weight: bold; margin: 0; }
                .cashback-amount .label { font-size: 14px; opacity: 0.9; margin: 5px 0 0 0; }
                .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .order-details h3 { margin: 0 0 15px 0; color: #333; font-size: 18px; }
                .order-info { display: flex; justify-content: space-between; margin: 8px 0; }
                .order-info span:first-child { font-weight: 600; color: #666; }
                .cta-button { display: inline-block; background: linear-gradient(135deg, #00a651, #00c766); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                .celebration { text-align: center; font-size: 48px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Cashback Approved!</h1>
                </div>
                
                <div class="content">
                    <div class="celebration">🚀💰✨</div>
                    
                    <p>Hi <?php echo esc_html($user->display_name); ?>,</p>
                    
                    <p>Great news! Your cashback has been approved and credited to your wallet.</p>
                    
                    <div class="cashback-amount">
                        <p class="amount">₹<?php echo number_format($amount, 2); ?></p>
                        <p class="label">Credited to Your Wallet</p>
                    </div>
                    
                    <?php if ($order): ?>
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <div class="order-info">
                            <span>Order Number:</span>
                            <span>#<?php echo $order->get_order_number(); ?></span>
                        </div>
                        <div class="order-info">
                            <span>Order Total:</span>
                            <span>₹<?php echo number_format($order->get_total(), 2); ?></span>
                        </div>
                        <div class="order-info">
                            <span>Order Date:</span>
                            <span><?php echo $order->get_date_created()->date_i18n(get_option('date_format')); ?></span>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <p>You can now use this cashback for future purchases or track your earnings in your wallet.</p>
                    
                    <div style="text-align: center;">
                        <a href="<?php echo esc_url($wallet_url); ?>" class="cta-button">View My Wallet</a>
                    </div>
                    
                    <p>Keep ordering to earn more cashback rewards! The more consistent you are, the higher your rewards get.</p>
                    
                    <p>Happy shopping!<br>
                    The <?php echo esc_html($site_name); ?> Team</p>
                </div>
                
                <div class="footer">
                    <p>&copy; <?php echo date('Y'); ?> <?php echo esc_html($site_name); ?>. All rights reserved.</p>
                    <p><a href="<?php echo esc_url($site_url); ?>" style="color: #00a651;">Visit our website</a></p>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }
    
    private static function get_cashback_processed_email_template($user, $amount, $order) {
        $site_name = get_bloginfo('name');
        $site_url = home_url();
        
        ob_start();
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cashback Earned</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #00a651, #00c766); padding: 30px 20px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .cashback-amount { background: linear-gradient(135deg, #00a651, #00c766); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .cashback-amount .amount { font-size: 36px; font-weight: bold; margin: 0; }
                .cashback-amount .label { font-size: 14px; opacity: 0.9; margin: 5px 0 0 0; }
                .status-badge { background-color: #fff3cd; color: #856404; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin: 10px 0; }
                .order-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>💰 Cashback Earned!</h1>
                </div>
                
                <div class="content">
                    <p>Hi <?php echo esc_html($user->display_name); ?>,</p>
                    
                    <p>Congratulations! You've earned cashback on your recent order.</p>
                    
                    <div class="cashback-amount">
                        <p class="amount">₹<?php echo number_format($amount, 2); ?></p>
                        <p class="label">Cashback Earned</p>
                    </div>
                    
                    <div style="text-align: center;">
                        <span class="status-badge">⏳ Pending Approval</span>
                    </div>
                    
                    <?php if ($order): ?>
                    <div class="order-details">
                        <h3>Order Details</h3>
                        <p><strong>Order:</strong> #<?php echo $order->get_order_number(); ?></p>
                        <p><strong>Total:</strong> ₹<?php echo number_format($order->get_total(), 2); ?></p>
                        <p><strong>Date:</strong> <?php echo $order->get_date_created()->date_i18n(get_option('date_format')); ?></p>
                    </div>
                    <?php endif; ?>
                    
                    <p>Your cashback is currently being reviewed and will be credited to your wallet once approved. You'll receive another email when it's ready!</p>
                    
                    <p>Keep ordering regularly to maximize your cashback rewards. Our algorithm rewards consistent customers with higher cashback amounts!</p>
                    
                    <p>Thank you for choosing <?php echo esc_html($site_name); ?>!</p>
                </div>
                
                <div class="footer">
                    <p>&copy; <?php echo date('Y'); ?> <?php echo esc_html($site_name); ?>. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }
    
    public static function send_admin_notification($cashback_id, $user_id, $amount, $order_id) {
        $admin_email = get_option('admin_email');
        $user = get_user_by('id', $user_id);
        $order = wc_get_order($order_id);
        
        $subject = sprintf(__('New Cashback Pending Approval - ₹%.2f'), $amount);
        
        $message = sprintf(
            __("A new cashback entry is pending approval:\n\n" .
               "Customer: %s (%s)\n" .
               "Order: #%s\n" .
               "Cashback Amount: ₹%.2f\n" .
               "Order Total: ₹%.2f\n\n" .
               "Please review and approve in the admin dashboard."),
            $user->display_name,
            $user->user_email,
            $order->get_order_number(),
            $amount,
            $order->get_total()
        );
        
        return wp_mail($admin_email, $subject, $message);
    }
}
