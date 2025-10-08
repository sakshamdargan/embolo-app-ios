<?php
namespace EcoSwift\ChemistApi;

if (!defined('ABSPATH')) {
    exit;
}

class Chemist_Products_Controller {
    const NAMESPACE = 'eco-swift/v1';

    public function register_routes(): void {
        // Get Products with Pagination and Lazy Loading
        register_rest_route(self::NAMESPACE, '/products', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_products'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'page'     => ['type' => 'integer', 'default' => 1],
                'per_page' => ['type' => 'integer', 'default' => 20],
                'search'   => ['type' => 'string'],
                'category' => ['type' => 'integer'],
                'vendor'   => ['type' => 'string'], // Support vendor filtering
                'orderby'  => ['type' => 'string', 'default' => 'date'],
                'order'    => ['type' => 'string', 'default' => 'DESC'],
            ],
        ]);

        // Search Products (optimized for large catalogs)
        register_rest_route(self::NAMESPACE, '/products/search', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'search_products'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'q'        => ['required' => true, 'type' => 'string'],
                'page'     => ['type' => 'integer', 'default' => 1],
                'per_page' => ['type' => 'integer', 'default' => 20],
                'vendor'   => ['type' => 'string'], // Support vendor filtering in search
            ],
        ]);

        // Get Single Product
        register_rest_route(self::NAMESPACE, '/products/(?P<id>\d+)', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_product'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'id' => ['required' => true, 'type' => 'integer'],
            ],
        ]);

        // Get Vendors/Wholesalers
        register_rest_route(self::NAMESPACE, '/vendors', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_vendors'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'per_page' => ['type' => 'integer', 'default' => 50],
                'search'   => ['type' => 'string'],
            ],
        ]);

        // Get Categories
        register_rest_route(self::NAMESPACE, '/categories', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_categories'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'per_page' => ['type' => 'integer', 'default' => 50],
                'hide_empty' => ['type' => 'boolean', 'default' => true],
            ],
        ]);

        // Get Featured Products
        register_rest_route(self::NAMESPACE, '/products/featured', [
            'methods'             => \WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_featured_products'],
            'permission_callback' => [$this, 'check_auth_permission'],
            'args'                => [
                'per_page' => ['type' => 'integer', 'default' => 10],
            ],
        ]);
    }

    public function get_products(\WP_REST_Request $request) {
        try {
            $page = $request->get_param('page');
            $per_page = min($request->get_param('per_page'), 50); // Limit to 50 per page
            $search = $request->get_param('search');
            $category = $request->get_param('category');
            $vendor = $request->get_param('vendor');
            $orderby = $request->get_param('orderby');
            $order = $request->get_param('order');

            $args = [
                'post_type' => 'product',
                'post_status' => 'publish',
                'posts_per_page' => $per_page,
                'paged' => $page,
                'orderby' => $orderby,
                'order' => $order,
                'meta_query' => [
                    [
                        'key' => '_stock_status',
                        'value' => 'instock',
                        'compare' => '='
                    ]
                ]
            ];

            // Add search query
            if ($search) {
                $args['s'] = sanitize_text_field($search);
            }

            // Add category filter
            if ($category) {
                $args['tax_query'] = [
                    [
                        'taxonomy' => 'product_cat',
                        'field' => 'term_id',
                        'terms' => intval($category)
                    ]
                ];
            }

            // Add vendor filter - filter by product author (vendor who created the product)
            if ($vendor) {
                $vendor_ids = explode(',', $vendor);
                $vendor_ids = array_map('intval', $vendor_ids);
                $args['author__in'] = $vendor_ids;
                error_log('Eco Swift: Filtering products by vendor IDs: ' . implode(',', $vendor_ids));
            }

            $query = new \WP_Query($args);
            $products = [];

            foreach ($query->posts as $post) {
                $product = wc_get_product($post->ID);
                if ($product) {
                    $products[] = $this->format_product($product);
                }
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $products,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $per_page,
                    'total_items' => $query->found_posts,
                    'total_pages' => $query->max_num_pages,
                    'has_more' => $page < $query->max_num_pages
                ]
            ]);

        } catch (Exception $e) {
            return new \WP_Error('products_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function search_products(\WP_REST_Request $request) {
        try {
            $query = sanitize_text_field($request->get_param('q'));
            $page = $request->get_param('page');
            $per_page = min($request->get_param('per_page'), 20);
            $vendor = $request->get_param('vendor');

            // Use WordPress search with custom relevance scoring
            $args = [
                'post_type' => 'product',
                'post_status' => 'publish',
                'posts_per_page' => $per_page,
                'paged' => $page,
                's' => $query,
                'meta_query' => [
                    [
                        'key' => '_stock_status',
                        'value' => 'instock',
                        'compare' => '='
                    ]
                ],
                // Search in title and content with relevance
                'orderby' => 'relevance',
                'order' => 'DESC'
            ];

            // Add vendor filter to search - filter by product author (vendor who created the product)
            if ($vendor) {
                $vendor_ids = explode(',', $vendor);
                $vendor_ids = array_map('intval', $vendor_ids);
                $args['author__in'] = $vendor_ids;
                error_log('Eco Swift: Filtering search by vendor IDs: ' . implode(',', $vendor_ids));
            }

            $wp_query = new \WP_Query($args);
            $products = [];

            foreach ($wp_query->posts as $post) {
                $product = wc_get_product($post->ID);
                if ($product) {
                    $products[] = $this->format_product($product);
                }
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $products,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $per_page,
                    'total_items' => $wp_query->found_posts,
                    'total_pages' => $wp_query->max_num_pages,
                    'has_more' => $page < $wp_query->max_num_pages
                ],
                'query' => $query
            ]);

        } catch (Exception $e) {
            return new \WP_Error('search_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function get_product(\WP_REST_Request $request) {
        try {
            $product_id = $request->get_param('id');
            $product = wc_get_product($product_id);

            if (!$product) {
                return new \WP_Error('product_not_found', 'Product not found', ['status' => 404]);
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $this->format_product($product, true) // Include full details
            ]);

        } catch (Exception $e) {
            return new \WP_Error('product_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function get_categories(\WP_REST_Request $request) {
        try {
            $per_page = $request->get_param('per_page');
            $hide_empty = $request->get_param('hide_empty');

            $args = [
                'taxonomy' => 'product_cat',
                'hide_empty' => $hide_empty,
                'number' => $per_page,
                'orderby' => 'name',
                'order' => 'ASC'
            ];

            $categories = get_terms($args);
            $formatted_categories = [];

            foreach ($categories as $category) {
                $thumbnail_id = get_term_meta($category->term_id, 'thumbnail_id', true);
                $image_url = $thumbnail_id ? wp_get_attachment_url($thumbnail_id) : null;

                $formatted_categories[] = [
                    'id' => $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'count' => $category->count,
                    'image' => $image_url ? ['src' => $image_url] : null
                ];
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $formatted_categories
            ]);

        } catch (Exception $e) {
            return new \WP_Error('categories_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    public function get_featured_products(\WP_REST_Request $request) {
        try {
            $per_page = min($request->get_param('per_page'), 20);

            $args = [
                'post_type' => 'product',
                'post_status' => 'publish',
                'posts_per_page' => $per_page,
                'meta_query' => [
                    [
                        'key' => '_featured',
                        'value' => 'yes',
                        'compare' => '='
                    ],
                    [
                        'key' => '_stock_status',
                        'value' => 'instock',
                        'compare' => '='
                    ]
                ],
                'orderby' => 'rand'
            ];

            $query = new \WP_Query($args);
            $products = [];

            foreach ($query->posts as $post) {
                $product = wc_get_product($post->ID);
                if ($product) {
                    $products[] = $this->format_product($product);
                }
            }

            return rest_ensure_response([
                'success' => true,
                'data' => $products
            ]);

        } catch (Exception $e) {
            return new \WP_Error('featured_products_fetch_failed', $e->getMessage(), ['status' => 500]);
        }
    }

    private function format_product($product, $full_details = false) {
        $images = [];
        $image_ids = $product->get_gallery_image_ids();
        
        // Add main image first
        if ($product->get_image_id()) {
            array_unshift($image_ids, $product->get_image_id());
        }

        foreach ($image_ids as $image_id) {
            $image_url = wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail');
            if ($image_url) {
                $images[] = [
                    'id' => $image_id,
                    'src' => $image_url,
                    'alt' => get_post_meta($image_id, '_wp_attachment_image_alt', true)
                ];
            }
        }

        $categories = [];
        $terms = get_the_terms($product->get_id(), 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            foreach ($terms as $term) {
                $categories[] = [
                    'id' => $term->term_id,
                    'name' => $term->name,
                    'slug' => $term->slug
                ];
            }
        }

        // Get vendor/store information - prioritize store name
        $author_id = get_post_field('post_author', $product->get_id());
        $store_info = null;
        if ($author_id) {
            // Priority: dokan_store_name > shop_name > store_name > display_name
            $store_name = get_user_meta($author_id, 'dokan_store_name', true) ?:
                         get_userdata($author_id)->display_name;
            
            $store_info = [
                'id' => intval($author_id),
                'name' => $store_name,
                'url' => ''
            ];
        }

        $formatted = [
            'id' => $product->get_id(),
            'name' => $product->get_name(),
            'slug' => $product->get_slug(),
            'price' => $product->get_price(),
            'regular_price' => $product->get_regular_price(),
            'sale_price' => $product->get_sale_price(),
            'price_html' => $product->get_price_html(),
            'on_sale' => $product->is_on_sale(),
            'stock_status' => $product->get_stock_status(),
            'stock_quantity' => $product->get_stock_quantity(),
            'manage_stock' => $product->get_manage_stock(),
            'images' => $images,
            'categories' => $categories,
            'short_description' => $product->get_short_description(),
            'sku' => $product->get_sku(),
            'weight' => $product->get_weight(),
            'dimensions' => [
                'length' => $product->get_length(),
                'width' => $product->get_width(),
                'height' => $product->get_height()
            ],
            'store' => $store_info
        ];

        // Add full details if requested (for single product view)
        if ($full_details) {
            $formatted['description'] = $product->get_description();
            $formatted['attributes'] = $this->get_product_attributes($product);
            $formatted['variations'] = $this->get_product_variations($product);
            $formatted['related_ids'] = wc_get_related_products($product->get_id(), 4);
        }

        return $formatted;
    }

    private function get_product_attributes($product) {
        $attributes = [];
        foreach ($product->get_attributes() as $attribute) {
            $attributes[] = [
                'name' => $attribute->get_name(),
                'options' => $attribute->get_options(),
                'visible' => $attribute->get_visible(),
                'variation' => $attribute->get_variation()
            ];
        }
        return $attributes;
    }

    private function get_product_variations($product) {
        if (!$product->is_type('variable')) {
            return [];
        }

        $variations = [];
        foreach ($product->get_available_variations() as $variation_data) {
            $variation = wc_get_product($variation_data['variation_id']);
            if ($variation) {
                $variations[] = [
                    'id' => $variation->get_id(),
                    'price' => $variation->get_price(),
                    'regular_price' => $variation->get_regular_price(),
                    'sale_price' => $variation->get_sale_price(),
                    'stock_status' => $variation->get_stock_status(),
                    'stock_quantity' => $variation->get_stock_quantity(),
                    'attributes' => $variation_data['attributes'],
                    'image' => $variation_data['image']
                ];
            }
        }
        return $variations;
    }

    public function get_vendors(\WP_REST_Request $request) {
        $per_page = $request->get_param('per_page') ?: 50;
        $search = $request->get_param('search');

        // Get users with vendor/seller role
        $args = [
            'role__in' => ['vendor', 'seller', 'shop_manager'], // Common vendor roles
            'number' => $per_page,
            'fields' => ['ID', 'display_name', 'user_email']
        ];

        if ($search) {
            $args['search'] = '*' . esc_attr($search) . '*';
        }

        $users = get_users($args);
        $vendors = [];

        foreach ($users as $user) {
            // Get vendor/store information - prioritize dokan_store_name
            $store_name = get_user_meta($user->ID, 'dokan_store_name', true) ?: 
                         get_user_meta($user->ID, 'shop_name', true) ?: 
                         get_user_meta($user->ID, 'store_name', true) ?: 
                         $user->display_name;
            
            $store_address = get_user_meta($user->ID, 'store_address', true);
            $store_city = get_user_meta($user->ID, 'store_city', true);
            $store_country = get_user_meta($user->ID, 'store_country', true) ?: 'India';

            $vendors[] = [
                'id' => $user->ID,
                'store_name' => $store_name,
                'vendor_name' => $store_name, // Use store name as vendor name too
                'email' => $user->user_email,
                'address' => [
                    'street_1' => $store_address ?: '',
                    'city' => $store_city ?: '',
                    'country' => $store_country
                ]
            ];
        }

        return rest_ensure_response([
            'success' => true,
            'data' => $vendors,
            'total' => count($vendors)
        ]);
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

    private function get_token_from_request(\WP_REST_Request $request) {
        $header = $request->get_header('Authorization');
        if ($header && stripos($header, 'Bearer ') === 0) {
            return trim(substr($header, 7));
        }
        return null;
    }
}
