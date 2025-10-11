<?php
namespace Embolo\Cashback;

if (!defined('ABSPATH')) {
    exit;
}

class Database {
    
    public static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Cashback entries table
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        $cashback_sql = "CREATE TABLE $cashback_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            order_id bigint(20) unsigned NOT NULL,
            cashback_amount decimal(10,2) NOT NULL DEFAULT 0.00,
            status varchar(20) NOT NULL DEFAULT 'processing',
            algorithm_data longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            approved_by bigint(20) unsigned NULL,
            approved_at datetime NULL,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY order_id (order_id),
            KEY status (status),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        // Wallet balances table
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        $wallet_sql = "CREATE TABLE $wallet_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL UNIQUE,
            total_balance decimal(10,2) NOT NULL DEFAULT 0.00,
            lifetime_earned decimal(10,2) NOT NULL DEFAULT 0.00,
            total_orders bigint(20) unsigned NOT NULL DEFAULT 0,
            last_order_date datetime NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id),
            KEY total_balance (total_balance),
            KEY last_order_date (last_order_date)
        ) $charset_collate;";
        
        // User streaks and engagement table
        $streaks_table = $wpdb->prefix . 'embolo_user_streaks';
        $streaks_sql = "CREATE TABLE $streaks_table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL UNIQUE,
            current_streak int(11) NOT NULL DEFAULT 0,
            longest_streak int(11) NOT NULL DEFAULT 0,
            last_order_date date NULL,
            streak_start_date date NULL,
            engagement_score decimal(3,1) NOT NULL DEFAULT 0.0,
            total_breaks int(11) NOT NULL DEFAULT 0,
            comeback_bonus_eligible tinyint(1) NOT NULL DEFAULT 0,
            milestone_data longtext,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY user_id (user_id),
            KEY current_streak (current_streak),
            KEY engagement_score (engagement_score),
            KEY last_order_date (last_order_date)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        
        dbDelta($cashback_sql);
        dbDelta($wallet_sql);
        dbDelta($streaks_sql);
        
        // Add version option
        add_option('embolo_cashback_db_version', '1.0.0');
    }
    
    public static function get_cashback_entries($user_id = null, $limit = 50, $offset = 0, $status = null) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $where_clauses = [];
        $where_values = [];
        
        if ($user_id) {
            $where_clauses[] = 'user_id = %d';
            $where_values[] = $user_id;
        }
        
        if ($status) {
            $where_clauses[] = 'status = %s';
            $where_values[] = $status;
        }
        
        $where_sql = '';
        if (!empty($where_clauses)) {
            $where_sql = 'WHERE ' . implode(' AND ', $where_clauses);
        }
        
        $sql = "SELECT * FROM $cashback_table $where_sql ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $where_values[] = $limit;
        $where_values[] = $offset;
        
        return $wpdb->get_results($wpdb->prepare($sql, $where_values));
    }
    
    public static function create_cashback_entry($user_id, $order_id, $amount, $algorithm_data = null) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $result = $wpdb->insert(
            $cashback_table,
            [
                'user_id' => $user_id,
                'order_id' => $order_id,
                'cashback_amount' => $amount,
                'status' => 'processing',
                'algorithm_data' => $algorithm_data ? wp_json_encode($algorithm_data) : null,
            ],
            ['%d', '%d', '%f', '%s', '%s']
        );
        
        if ($result) {
            return $wpdb->insert_id;
        }
        
        return false;
    }
    
    public static function update_cashback_status($cashback_id, $status, $approved_by = null) {
        global $wpdb;
        
        $cashback_table = $wpdb->prefix . 'embolo_cashback';
        
        $update_data = [
            'status' => $status,
            'updated_at' => current_time('mysql')
        ];
        
        if ($status === 'completed' && $approved_by) {
            $update_data['approved_by'] = $approved_by;
            $update_data['approved_at'] = current_time('mysql');
        }
        
        return $wpdb->update(
            $cashback_table,
            $update_data,
            ['id' => $cashback_id],
            ['%s', '%s', '%d', '%s'],
            ['%d']
        );
    }
    
    public static function get_or_create_wallet($user_id) {
        global $wpdb;
        
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        // Try to get existing wallet
        $wallet = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $wallet_table WHERE user_id = %d",
            $user_id
        ));
        
        if (!$wallet) {
            // Create new wallet
            $wpdb->insert(
                $wallet_table,
                ['user_id' => $user_id],
                ['%d']
            );
            
            $wallet = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $wallet_table WHERE user_id = %d",
                $user_id
            ));
        }
        
        return $wallet;
    }
    
    public static function update_wallet_balance($user_id, $amount_to_add) {
        global $wpdb;
        
        $wallet_table = $wpdb->prefix . 'embolo_wallets';
        
        // Ensure wallet exists
        self::get_or_create_wallet($user_id);
        
        return $wpdb->query($wpdb->prepare(
            "UPDATE $wallet_table 
             SET total_balance = total_balance + %f,
                 lifetime_earned = lifetime_earned + %f,
                 updated_at = %s
             WHERE user_id = %d",
            $amount_to_add,
            $amount_to_add > 0 ? $amount_to_add : 0,
            current_time('mysql'),
            $user_id
        ));
    }
    
    public static function get_or_create_streak($user_id) {
        global $wpdb;
        
        $streaks_table = $wpdb->prefix . 'embolo_user_streaks';
        
        // Try to get existing streak
        $streak = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $streaks_table WHERE user_id = %d",
            $user_id
        ));
        
        if (!$streak) {
            // Create new streak record
            $wpdb->insert(
                $streaks_table,
                ['user_id' => $user_id],
                ['%d']
            );
            
            $streak = $wpdb->get_row($wpdb->prepare(
                "SELECT * FROM $streaks_table WHERE user_id = %d",
                $user_id
            ));
        }
        
        return $streak;
    }
    
    public static function update_user_streak($user_id, $streak_data) {
        global $wpdb;
        
        $streaks_table = $wpdb->prefix . 'embolo_user_streaks';
        
        // Ensure streak record exists
        self::get_or_create_streak($user_id);
        
        $update_data = array_merge($streak_data, [
            'updated_at' => current_time('mysql')
        ]);
        
        return $wpdb->update(
            $streaks_table,
            $update_data,
            ['user_id' => $user_id],
            null,
            ['%d']
        );
    }
}
