<?php
/**
 * Plugin Name: Elementor WooCommerce Product Creator
 * Description: Plugin tạo widget Elementor cho phép tạo sản phẩm WooCommerce trực tiếp từ editor với popup nhập tên và giá sản phẩm.
 * Version: 1.0.0
 * Author: Nguyễn Đình Đường 
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Main Plugin Class
 */
final class Elementor_WC_Product_Creator {

	/**
	 * Plugin Version
	 */
	const VERSION = '1.0.0';

	/**
	 * Minimum Elementor Version
	 */
	const MINIMUM_ELEMENTOR_VERSION = '2.0.0';

	/**
	 * Minimum PHP Version
	 */
	const MINIMUM_PHP_VERSION = '7.0';

	/**
	 * Instance
	 */
	private static $_instance = null;

	/**
	 * Instance
	 */
	public static function instance() {
		if ( is_null( self::$_instance ) ) {
			self::$_instance = new self();
		}
		return self::$_instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {
		add_action( 'plugins_loaded', [ $this, 'on_plugins_loaded' ] );
	}

	/**
	 * Load Textdomain
	 */
	public function i18n() {
		load_plugin_textdomain( 'elementor-wc-product-creator' );
	}

	/**
	 * On Plugins Loaded
	 */
	public function on_plugins_loaded() {
		if ( class_exists( 'WooCommerce' ) ) {
			add_action( 'before_woocommerce_init', [ $this, 'declare_woocommerce_compatibility' ] );
		}
		
		if ( $this->is_compatible() ) {
			add_action( 'elementor/init', [ $this, 'init' ] );
		}
	}

	/**
	 * Compatibility Checks
	 */
	public function is_compatible() {
		// Check if Elementor installed and activated
		if ( ! did_action( 'elementor/loaded' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_missing_main_plugin' ] );
			return false;
		}
		
		// Check if WooCommerce is active
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', [ $this, 'admin_notice_missing_woocommerce' ] );
			return false;
		}

		return true;
	}

	/**
	 * Initialize
	 */
	public function init() {
		$this->i18n();

		// Register Widget Scripts
		add_action( 'elementor/frontend/after_register_scripts', [ $this, 'widget_scripts' ] );
		add_action( 'elementor/frontend/after_register_styles', [ $this, 'widget_styles' ] );

		// Enqueue scripts and styles in editor
		add_action( 'elementor/editor/after_enqueue_scripts', [ $this, 'editor_scripts' ] );
		add_action( 'elementor/editor/after_enqueue_styles', [ $this, 'editor_styles' ] );

		// Enqueue scripts and styles on frontend
		add_action( 'elementor/frontend/after_enqueue_scripts', [ $this, 'frontend_scripts' ] );
		add_action( 'elementor/frontend/after_enqueue_styles', [ $this, 'frontend_styles' ] );

		// Register Widget
		add_action( 'elementor/widgets/register', [ $this, 'register_widgets' ] );

		// Register AJAX handlers
		add_action( 'wp_ajax_ewcpc_create_product', [ $this, 'ajax_create_product' ] );
		add_action( 'wp_ajax_ewcpc_get_products', [ $this, 'ajax_get_products' ] );
		add_action( 'wp_ajax_ewcpc_get_products_list', [ $this, 'ajax_get_products_list' ] );
	}

	/**
	 * Declare compatibility with WooCommerce features
	 * This must be called before woocommerce_init
	 */
	public function declare_woocommerce_compatibility() {
		if ( ! class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			return;
		}

		$plugin_file = plugin_basename( __FILE__ );

		$features = [
			'custom_order_tables',      
			'cart_checkout_blocks',     
			'product_block_editor',   
		];

		foreach ( $features as $feature_id ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( $feature_id, $plugin_file, true );
		}
	}

	/**
	 * Register Widget Scripts
	 */
	public function widget_scripts() {
		wp_register_script(
			'ewcpc-widget',
			plugins_url( '/assets/js/widget.js', __FILE__ ),
			[ 'jquery', 'elementor-frontend' ],
			self::VERSION,
			true
		);

		wp_localize_script( 'ewcpc-widget', 'ewcpcAjax', [
			'ajaxurl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'ewcpc_nonce' ),
		] );
	}

	/**
	 * Register Widget Styles
	 */
	public function widget_styles() {
		wp_register_style(
			'ewcpc-widget',
			plugins_url( '/assets/css/widget.css', __FILE__ ),
			[],
			self::VERSION
		);
	}

	/**
	 * Enqueue Editor Scripts
	 */
	public function editor_scripts() {
		wp_enqueue_script(
			'ewcpc-widget',
			plugins_url( '/assets/js/widget.js', __FILE__ ),
			[ 'jquery', 'elementor-frontend' ],
			self::VERSION,
			true
		);

		wp_enqueue_script(
			'ewcpc-editor',
			plugins_url( '/assets/js/editor.js', __FILE__ ),
			[ 'jquery', 'elementor-editor' ],
			self::VERSION,
			true
		);

		wp_localize_script( 'ewcpc-widget', 'ewcpcAjax', [
			'ajaxurl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'ewcpc_nonce' ),
		] );

		wp_localize_script( 'ewcpc-editor', 'ewcpcAjax', [
			'ajaxurl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'ewcpc_nonce' ),
		] );
	}

	/**
	 * Enqueue Editor Styles
	 */
	public function editor_styles() {
		wp_enqueue_style(
			'ewcpc-widget',
			plugins_url( '/assets/css/widget.css', __FILE__ ),
			[],
			self::VERSION
		);
	}

	/**
	 * Enqueue Frontend Scripts
	 */
	public function frontend_scripts() {
		wp_enqueue_script( 'ewcpc-widget' );
	}

	/**
	 * Enqueue Frontend Styles
	 */
	public function frontend_styles() {
		wp_enqueue_style( 'ewcpc-widget' );
	}

	/**
	 * Register Widgets
	 */
	public function register_widgets( $widgets_manager ) {
		require_once( __DIR__ . '/widgets/product-creator-widget.php' );
		$widgets_manager->register( new \Elementor_WC_Product_Creator_Widget() );
	}

	/**
	 * AJAX: Create Product using WooCommerce REST API
	 */
	public function ajax_create_product() {
		check_ajax_referer( 'ewcpc_nonce', 'nonce' );

		if ( ! current_user_can( 'edit_products' ) ) {
			wp_send_json_error( [ 'message' => 'Bạn không có quyền tạo sản phẩm.' ] );
		}

		$product_name = isset( $_POST['product_name'] ) ? sanitize_text_field( $_POST['product_name'] ) : '';
		$product_price = isset( $_POST['product_price'] ) ? floatval( $_POST['product_price'] ) : 0;

		if ( empty( $product_name ) ) {
			wp_send_json_error( [ 'message' => 'Vui lòng nhập tên sản phẩm.' ] );
		}

		if ( $product_price <= 0 ) {
			wp_send_json_error( [ 'message' => 'Vui lòng nhập giá sản phẩm hợp lệ.' ] );
		}

		// Use WooCommerce REST API Controller directly
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			wp_send_json_error( [ 'message' => 'Bạn cần đăng nhập để tạo sản phẩm.' ] );
		}

		// Ensure user is set
		wp_set_current_user( $user_id );

		// Load WooCommerce REST API controller
		if ( ! class_exists( 'WC_REST_Products_Controller' ) ) {
			wp_send_json_error( [ 'message' => 'WooCommerce REST API không khả dụng.' ] );
		}

		// Prepare product data according to WooCommerce REST API format
		$product_data = [
			'name' => $product_name,
			'type' => 'simple',
			'regular_price' => (string) $product_price,
			'status' => 'publish',
		];

		// Create REST API request
		$request = new WP_REST_Request( 'POST', '/wc/v3/products' );
		$request->set_body_params( $product_data );
		
		// Create controller instance
		$controller = new WC_REST_Products_Controller();
		
		// Check permissions first
		$permission_check = $controller->create_item_permissions_check( $request );
		if ( is_wp_error( $permission_check ) ) {
			wp_send_json_error( [ 
				'message' => $permission_check->get_error_message() ?: 'Bạn không có quyền tạo sản phẩm.' 
			] );
		}

		// Create the product via REST API
		$response = $controller->create_item( $request );
		
		// Check if response is WP_Error
		if ( is_wp_error( $response ) ) {
			$error_message = $response->get_error_message();
			wp_send_json_error( [ 
				'message' => $error_message ?: 'Có lỗi xảy ra khi tạo sản phẩm qua REST API.' 
			] );
		}

		// Get response data
		$response_data = $response->get_data();
		$status_code = $response->get_status();
		
		// Check response status - 201 means created successfully
		if ( $status_code === 201 && isset( $response_data['id'] ) ) {
			$product_id = absint( $response_data['id'] );
			
			wp_send_json_success( [
				'message' => 'Sản phẩm đã được tạo thành công!',
				'product_id' => $product_id,
				'product_name' => $product_name,
				'product_price' => $product_price,
				'edit_link' => admin_url( 'post.php?post=' . $product_id . '&action=edit' ),
			] );
		} else {
			// Extract error message from response
			$error_message = 'Có lỗi xảy ra khi tạo sản phẩm.';
			
			if ( isset( $response_data['message'] ) ) {
				$error_message = $response_data['message'];
			} elseif ( isset( $response_data['code'] ) ) {
				$error_message = $response_data['code'];
			} elseif ( is_array( $response_data ) && ! empty( $response_data ) ) {
				// Try to get first error message
				$first_key = array_key_first( $response_data );
				if ( isset( $response_data[ $first_key ][0] ) ) {
					$error_message = $response_data[ $first_key ][0];
				}
			}
			
			wp_send_json_error( [ 
				'message' => $error_message,
				'status' => $status_code
			] );
		}
	}

	/**
	 * AJAX: Get Products
	 */
	public function ajax_get_products() {
		check_ajax_referer( 'ewcpc_nonce', 'nonce' );

		$args = [
			'post_type' => 'product',
			'post_status' => 'publish',
			'posts_per_page' => 50,
			'orderby' => 'date',
			'order' => 'DESC',
		];

		$products = get_posts( $args );
		$products_data = [];

		foreach ( $products as $product ) {
			$wc_product = wc_get_product( $product->ID );
			if ( $wc_product ) {
				$products_data[] = [
					'id' => $product->ID,
					'name' => $product->post_title,
					'price' => $wc_product->get_price(),
					'permalink' => get_permalink( $product->ID ),
				];
			}
		}

		wp_send_json_success( [ 'products' => $products_data ] );
	}

	/**
	 * AJAX: Get Products List for Select Control
	 */
	public function ajax_get_products_list() {
		check_ajax_referer( 'ewcpc_nonce', 'nonce' );

		$products = [];
		
		if ( ! class_exists( 'WooCommerce' ) ) {
			wp_send_json_success( [ 'products' => $products ] );
		}

		$args = [
			'post_type' => 'product',
			'post_status' => 'publish',
			'posts_per_page' => 100,
			'orderby' => 'title',
			'order' => 'ASC',
		];

		$query = new \WP_Query( $args );
		
		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$product = wc_get_product( get_the_ID() );
				if ( $product ) {
					$product_id = get_the_ID();
					$product_name = get_the_title();
					$product_price = $product->get_price();
					
					$formatted_price = '';
					$currency_symbol = html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8' );
					if ( $product_price ) {
						$formatted_price = number_format( floatval( $product_price ), 0, ',', '.' ) . ' ' . $currency_symbol;
					} else {
						$formatted_price = '0 ' . $currency_symbol;
					}
					
					$products[ $product_id ] = $product_name . ' - ' . $formatted_price;
				}
			}
			wp_reset_postdata();
		}

		wp_send_json_success( [ 'products' => $products ] );
	}

	/**
	 * Admin Notice: Missing Elementor
	 */
	public function admin_notice_missing_main_plugin() {
		$message = sprintf(
			esc_html__( '"%1$s" yêu cầu "%2$s" phải được cài đặt và kích hoạt.', 'elementor-wc-product-creator' ),
			'<strong>' . esc_html__( 'Elementor WooCommerce Product Creator', 'elementor-wc-product-creator' ) . '</strong>',
			'<strong>' . esc_html__( 'Elementor', 'elementor-wc-product-creator' ) . '</strong>'
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message );
	}

	/**
	 * Admin Notice: Minimum Elementor Version
	 */
	public function admin_notice_minimum_elementor_version() {
		$message = sprintf(
			esc_html__( '"%1$s" yêu cầu "%2$s" phiên bản %3$s trở lên.', 'elementor-wc-product-creator' ),
			'<strong>' . esc_html__( 'Elementor WooCommerce Product Creator', 'elementor-wc-product-creator' ) . '</strong>',
			'<strong>' . esc_html__( 'Elementor', 'elementor-wc-product-creator' ) . '</strong>',
			self::MINIMUM_ELEMENTOR_VERSION
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message );
	}

	/**
	 * Admin Notice: Minimum PHP Version
	 */
	public function admin_notice_minimum_php_version() {
		$message = sprintf(
			esc_html__( '"%1$s" yêu cầu "%2$s" phiên bản %3$s trở lên.', 'elementor-wc-product-creator' ),
			'<strong>' . esc_html__( 'Elementor WooCommerce Product Creator', 'elementor-wc-product-creator' ) . '</strong>',
			'<strong>' . esc_html__( 'PHP', 'elementor-wc-product-creator' ) . '</strong>',
			self::MINIMUM_PHP_VERSION
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message );
	}

	/**
	 * Admin Notice: Missing WooCommerce
	 */
	public function admin_notice_missing_woocommerce() {
		$message = sprintf(
			esc_html__( '"%1$s" yêu cầu "%2$s" phải được cài đặt và kích hoạt.', 'elementor-wc-product-creator' ),
			'<strong>' . esc_html__( 'Elementor WooCommerce Product Creator', 'elementor-wc-product-creator' ) . '</strong>',
			'<strong>' . esc_html__( 'WooCommerce', 'elementor-wc-product-creator' ) . '</strong>'
		);
		printf( '<div class="notice notice-warning is-dismissible"><p>%1$s</p></div>', $message );
	}
}

Elementor_WC_Product_Creator::instance();

