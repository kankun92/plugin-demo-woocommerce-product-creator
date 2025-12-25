# Elementor WooCommerce Product Creator

A WordPress plugin that allows you to create WooCommerce products directly from the Elementor Editor with a simple popup interface and display products on your page.

## Description

**Elementor WooCommerce Product Creator** is an extension plugin for Elementor that enables you to:

- Create new WooCommerce products directly from the Elementor Editor
- Display product information (name and price) on your page
- Fully integrated with Elementor and WooCommerce
- Uses WooCommerce REST API for compatibility

## Key Features

### 1. Create Products from Elementor Editor

- **Product creation button** in Elementor Panel: When you drag the "Product Creator" widget onto your page, a "Create New Product" button appears in the left panel
- **Simple popup form**: Clicking the button opens a popup with 2 fields:
  - Product name (required)
  - Product price (required)
- **Fast creation**: Products are created instantly in WooCommerce without page reload

### 2. Display Products on Page

- **Product selection dropdown**: Choose a product from the dropdown list
- **Display information**: The widget displays:
  - Product name
  - Product price (formatted according to WooCommerce settings)
- **Auto-update**: After creating a new product, the dropdown automatically refreshes and the new product is automatically selected

### 3. WooCommerce Compatibility

- Uses **WooCommerce REST API** to create products
- Declares compatibility with modern WooCommerce features:
  - High-Performance Order Storage (HPOS)
  - Cart & Checkout Blocks
  - Product Block Editor
- No compatibility warnings

## Usage

### Step 1: Add Widget to Page

1. Open Elementor Editor for the page you want to edit
2. Drag the **"Product Creator"** widget from the left panel onto your page
3. The widget will appear on your page

### Step 2: Create New Product

1. In the Elementor Panel (left side), find the **"Content"** section
2. Click the **"Create New Product"** button
3. A popup will appear with a form:
   - Enter **Product name**
   - Enter **Product price** (number)
4. Click **"Save"**
5. The product will be created in WooCommerce and automatically selected in the dropdown

### Step 3: Display Product

1. After creating a product, the **"Select product"** dropdown will automatically include the new product
2. Or you can select a different product from the dropdown
3. The widget will automatically display the product name and price on the page

## Plugin Structure

```
elementor-woocommerce-product-creator/
├── elementor-woocommerce-product-creator.php  # Main plugin file
├── widgets/
│   └── product-creator-widget.php            # Elementor widget
├── assets/
│   ├── js/
│   │   ├── editor.js                         # JavaScript for editor
│   │   └── widget.js                         # JavaScript for frontend
│   └── css/
│       └── widget.css                        # Styles for popup and widget
└── README.md                                 # This file
```

## API Endpoints

The plugin uses the following AJAX endpoints:

- `ewcpc_create_product`: Create a new product via WooCommerce REST API
- `ewcpc_get_products_list`: Get product list to display in dropdown
