<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

/**
 * Elementor WooCommerce Product Creator Widget
 */
class Elementor_WC_Product_Creator_Widget extends \Elementor\Widget_Base {

	/**
	 * Get widget name.
	 */
	public function get_name() {
		return 'ewcpc_product_creator';
	}

	/**
	 * Get widget title.
	 */
	public function get_title() {
		return esc_html__( 'Tạo Sản Phẩm', 'elementor-wc-product-creator' );
	}

	/**
	 * Get widget icon.
	 */
	public function get_icon() {
		return 'eicon-product';
	}

	/**
	 * Get widget categories.
	 */
	public function get_categories() {
		return [ 'general' ];
	}

	/**
	 * Get widget keywords.
	 */
	public function get_keywords() {
		return [ 'woocommerce', 'product', 'creator', 'sản phẩm' ];
	}

	/**
	 * Register widget scripts.
	 */
	public function get_script_depends() {
		return [ 'ewcpc-widget' ];
	}

	/**
	 * Register widget styles.
	 */
	public function get_style_depends() {
		return [ 'ewcpc-widget' ];
	}

	/**
	 * Register widget controls.
	 */
	protected function register_controls() {

		// Content Section
		$this->start_controls_section(
			'content_section',
			[
				'label' => esc_html__( 'Nội dung', 'elementor-wc-product-creator' ),
				'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
			]
		);

		$this->add_control(
			'create_button',
			[
				'label' => esc_html__( 'Tạo sản phẩm', 'elementor-wc-product-creator' ),
				'type' => \Elementor\Controls_Manager::BUTTON,
				'text' => esc_html__( 'Tạo Sản Phẩm Mới', 'elementor-wc-product-creator' ),
				'event' => 'ewcpc:create_product',
				'separator' => 'after',
			]
		);

		$this->add_control(
			'product_id',
			[
				'label' => esc_html__( 'Chọn sản phẩm', 'elementor-wc-product-creator' ),
				'type' => \Elementor\Controls_Manager::SELECT2,
				'options' => $this->get_products_list(),
				'default' => '',
			]
		);

		$this->end_controls_section();
	}

	/**
	 * Get products list for select control
	 */
	private function get_products_list() {
		$products = [];
		
		if ( ! class_exists( 'WooCommerce' ) ) {
			return $products;
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

		return $products;
	}

	/**
	 * Render widget output on the frontend.
	 */
	protected function render() {
		$settings = $this->get_settings_for_display();
		$product_id = $settings['product_id'] ?? 0;
		
		if ( $product_id ) {
			$product = wc_get_product( $product_id );
			if ( $product ) {
				?>
				<div class="ewcpc-product-display">
					<h3 class="ewcpc-product-name"><?php echo esc_html( $product->get_name() ); ?></h3>
					<div class="ewcpc-product-price"><?php echo $product->get_price_html(); ?></div>
				</div>
				<?php
				return;
			}
		}
		?>
		<div class="ewcpc-product-display">
			<p>Vui lòng chọn sản phẩm để hiển thị.</p>
		</div>
		<?php
	}

	/**
	 * Render widget output in the editor.
	 */
	protected function content_template() {
		$products_data = $this->get_products_data_for_editor();
		?>
		<#
		var productId = settings.product_id || 0;
		var productsData = <?php echo wp_json_encode( $products_data ); ?>;
		var product = productsData[productId];
		
		// Try to get product info from selected option text
		var productName = '';
		var productPrice = '';
		if (productId && !product) {
			// Try to extract from select option
			var $select = jQuery('.elementor-control-product_id select');
			if ($select.length) {
				var $selectedOption = $select.find('option[value="' + productId + '"]');
				if ($selectedOption.length) {
					var optionText = $selectedOption.text();
					// Format: "Product Name - 123.456 ₫"
					var parts = optionText.split(' - ');
					if (parts.length >= 2) {
						productName = parts[0];
						productPrice = parts.slice(1).join(' - ');
					}
				}
			}
		}
		#>
		<# if ( productId && product ) { #>
			<div class="ewcpc-product-display">
				<h3 class="ewcpc-product-name">{{{ product.name }}}</h3>
				<div class="ewcpc-product-price">{{{ product.price }}}</div>
			</div>
		<# } else if ( productId && productName ) { #>
			<div class="ewcpc-product-display">
				<h3 class="ewcpc-product-name">{{{ productName }}}</h3>
				<div class="ewcpc-product-price">{{{ productPrice }}}</div>
			</div>
		<# } else if ( productId ) { #>
			<div class="ewcpc-product-display">
				<h3 class="ewcpc-product-name">Sản phẩm #{{{ productId }}}</h3>
				<div class="ewcpc-product-price">Đang tải...</div>
			</div>
		<# } else { #>
			<div class="ewcpc-product-display">
				<p>Vui lòng chọn sản phẩm để hiển thị.</p>
			</div>
		<# } #>
		<?php
	}

	/**
	 * Get products data for editor template
	 */
	private function get_products_data_for_editor() {
		$products_data = [];
		
		if ( ! class_exists( 'WooCommerce' ) ) {
			return $products_data;
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
					$products_data[ $product_id ] = [
						'name' => get_the_title(),
						'price' => $product->get_price_html(),
					];
				}
			}
			wp_reset_postdata();
		}

		return $products_data;
	}
}

