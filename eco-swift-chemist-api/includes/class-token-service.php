<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Token_Service {
    
    public static function generate_token($user) {
        $secret = Settings::get_jwt_secret();
        $expire = Settings::get_jwt_expire();
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'iss' => get_bloginfo('url'),
            'aud' => get_bloginfo('url'),
            'iat' => time(),
            'exp' => time() + $expire,
            'data' => [
                'user' => [
                    'id' => $user->ID,
                    'email' => $user->user_email,
                    'roles' => $user->roles,
                    'business_type' => get_user_meta($user->ID, 'business_type', true)
                ]
            ]
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public static function validate_token($token) {
        try {
            $secret = Settings::get_jwt_secret();
            
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                return false;
            }
            
            list($base64Header, $base64Payload, $base64Signature) = $parts;
            
            // Verify signature
            $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
            $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
            
            if (!hash_equals($signature, $expectedSignature)) {
                return false;
            }
            
            // Decode payload
            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)));
            
            // Check expiration
            if (isset($payload->exp) && time() > $payload->exp) {
                return false;
            }
            
            return $payload;
        } catch (Exception $e) {
            return false;
        }
    }
    
    public static function get_user_from_token($token) {
        $payload = self::validate_token($token);
        if (!$payload || !isset($payload->data->user->id)) {
            return false;
        }
        
        return get_user_by('id', $payload->data->user->id);
    }
}
