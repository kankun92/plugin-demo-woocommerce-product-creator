(function($) {
    'use strict';

    // Simple in-memory cache to avoid multiple AJAX calls
    var productsListCache = {
        data: null,
        loading: false,
        callbacks: []
    };

    // Track current widget being edited
    var currentWidgetContainer = null;
    var currentWidgetModel = null;

    // Function to get products list (single AJAX call, shared cache)
    function getProductsList(forceRefresh, callback) {
        // If cache exists and not forcing refresh, return cached data
        if (productsListCache.data && !forceRefresh) {
            if (callback) {
                callback(productsListCache.data);
            }
            return productsListCache.data;
        }

        // If already loading, add callback to queue
        if (productsListCache.loading) {
            if (callback) {
                productsListCache.callbacks.push(callback);
            }
            return null;
        }

        // Start loading
        productsListCache.loading = true;

        if (typeof ewcpcAjax === 'undefined') {
            productsListCache.loading = false;
            if (callback) {
                callback(null);
            }
            return null;
        }

        // Load from server
        $.ajax({
            url: ewcpcAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ewcpc_get_products_list',
                nonce: ewcpcAjax.nonce
            },
            success: function(response) {
                productsListCache.loading = false;

                if (response.success && response.data.products) {
                    // Cache the data
                    productsListCache.data = response.data.products;

                    // Execute all queued callbacks
                    productsListCache.callbacks.forEach(function(cb) {
                        cb(productsListCache.data);
                    });
                    productsListCache.callbacks = [];

                    // Execute current callback
                    if (callback) {
                        callback(productsListCache.data);
                    }
                } else {
                    // Execute callbacks with null on error
                    productsListCache.callbacks.forEach(function(cb) {
                        cb(null);
                    });
                    productsListCache.callbacks = [];
                    if (callback) {
                        callback(null);
                    }
                }
            },
            error: function() {
                productsListCache.loading = false;
                console.log('Error loading products list');

                // Execute callbacks with null on error
                productsListCache.callbacks.forEach(function(cb) {
                    cb(null);
                });
                productsListCache.callbacks = [];
                if (callback) {
                    callback(null);
                }
            }
        });

        return null;
    }

    // Function to refresh products list cache
    function refreshProductsListCache(callback) {
        productsListCache.data = null;
        getProductsList(true, callback);
    }

    // Function to update all select controls with products list
    function updateAllSelectControls(products, preserveValues) {
        if (!products) {
            return;
        }

        preserveValues = preserveValues || {};

        // Find all product select controls
        var $allSelects = $('.elementor-control-product_id select');

        $allSelects.each(function() {
            var $select = $(this);
            var currentValue = preserveValues[$select.closest('.elementor-control').data('id')] || $select.val();
            var isSelect2Initialized = $select.data('select2');

            // Clear all existing options
            $select.empty();

            // Add empty option first
            $select.append($('<option></option>').attr('value', '').text(''));

            // Add all products
            $.each(products, function(id, text) {
                var $option = $('<option></option>')
                    .attr('value', id)
                    .text(text);
                $select.append($option);
            });

            // Restore selected value if it exists and is still valid
            if (currentValue && products[currentValue]) {
                $select.val(currentValue);
            }

            // Refresh Select2 if initialized
            if (isSelect2Initialized) {
                $select.select2('destroy');
                setTimeout(function() {
                    if (typeof $select.select2 === 'function') {
                        $select.select2();
                        if (currentValue && products[currentValue]) {
                            $select.val(currentValue).trigger('change');
                        }
                    }
                }, 10);
            } else if (typeof $select.select2 === 'function') {
                setTimeout(function() {
                    if (!$select.data('select2')) {
                        $select.select2();
                        if (currentValue && products[currentValue]) {
                            $select.val(currentValue).trigger('change');
                        }
                    }
                }, 10);
            }
        });
    }

    // Function to get next product number to auto-select
    function getNextProductNumber(products) {
        if (!products || Object.keys(products).length === 0) {
            return '01';
        }

        // Extract product numbers from product names (e.g., "Sản phẩm 01" -> 1)
        var maxNumber = 0;
        $.each(products, function(id, text) {
            var match = text.match(/(?:sản\s*phẩm|product)\s*(\d+)/i);
            if (match && match[1]) {
                var num = parseInt(match[1], 10);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        // Return next number formatted as "01", "02", etc.
        var nextNumber = maxNumber + 1;
        return (nextNumber < 10 ? '0' : '') + nextNumber;
    }

    // Function to find product ID by number in name
    function findProductIdByNumber(products, number) {
        if (!products) {
            return null;
        }

        var searchPattern = new RegExp('(?:sản\\s*phẩm|product)\\s*' + number + '(?:\\s|$|-)', 'i');
        
        for (var id in products) {
            if (products.hasOwnProperty(id) && searchPattern.test(products[id])) {
                return id;
            }
        }

        return null;
    }

    // Function to open popup
    function openCreateProductPopup() {
        // Create popup HTML if not exists
        if ($('#ewcpc-popup').length === 0) {
            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                popupTitle: 'Create New Product',
                closeLabel: 'Close',
                productNameLabel: 'Product name',
                productPriceLabel: 'Product price',
                required: '*',
                productNamePlaceholder: 'Enter product name',
                productPricePlaceholder: '0.00',
                cancel: 'Cancel',
                save: 'Save',
                creating: 'Creating...',
                errorProductName: 'Please enter product name.',
                errorProductPrice: 'Please enter a valid product price.',
                errorConnection: 'An error occurred while connecting to the server.',
                errorGeneral: 'An error occurred.',
                successCreated: 'Product has been created and selected automatically!',
                loading: 'Loading...',
                product: 'Product',
                selectProduct: 'Please select a product to display.'
            };
            
            var popupHTML = `
                <div id="ewcpc-popup" class="ewcpc-popup-overlay" style="display: none;">
                    <div class="ewcpc-popup-content">
                        <div class="ewcpc-popup-header">
                            <h3>${strings.popupTitle}</h3>
                            <button type="button" class="ewcpc-popup-close" aria-label="${strings.closeLabel}">&times;</button>
                        </div>
                        <div class="ewcpc-popup-body">
                            <form id="ewcpc-product-form">
                                <div class="ewcpc-form-group">
                                    <label for="ewcpc-product-name">${strings.productNameLabel} <span class="required">${strings.required}</span></label>
                                    <input type="text" id="ewcpc-product-name" name="product_name" class="ewcpc-form-control" required placeholder="${strings.productNamePlaceholder}">
                                </div>
                                <div class="ewcpc-form-group">
                                    <label for="ewcpc-product-price">${strings.productPriceLabel} <span class="required">${strings.required}</span></label>
                                    <input type="number" id="ewcpc-product-price" name="product_price" class="ewcpc-form-control" step="0.01" min="0" required placeholder="${strings.productPricePlaceholder}">
                                </div>
                                <div class="ewcpc-form-message" id="ewcpc-form-message"></div>
                                <div class="ewcpc-form-actions">
                                    <button type="button" class="ewcpc-btn ewcpc-btn-cancel">${strings.cancel}</button>
                                    <button type="submit" class="ewcpc-btn ewcpc-btn-submit">${strings.save}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            $('body').append(popupHTML);
        }

        // Show popup
        $('#ewcpc-popup').fadeIn(300);
        $('#ewcpc-product-name').focus();

        // Reset submit button state when opening popup
        var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
        var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
            save: 'Save'
        };
        $submitBtn.prop('disabled', false).text(strings.save);

        // Setup popup handlers
        setupPopupHandlers();
    }

    // Function to setup popup handlers
    function setupPopupHandlers() {
        // Close popup
        function closePopup() {
            $('#ewcpc-popup').fadeOut(300);
            $('#ewcpc-product-form')[0].reset();
            $('#ewcpc-form-message').removeClass('ewcpc-success ewcpc-error').text('');
            
            // Reset submit button state
            var $submitBtn = $('#ewcpc-product-form').find('.ewcpc-btn-submit');
            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                save: 'Save'
            };
            $submitBtn.prop('disabled', false).text(strings.save);
        }

        $(document).off('click.ewcpc', '.ewcpc-popup-close, .ewcpc-btn-cancel').on('click.ewcpc', '.ewcpc-popup-close, .ewcpc-btn-cancel', closePopup);

        // Close popup when clicking outside
        $(document).off('click.ewcpc', '.ewcpc-popup-overlay').on('click.ewcpc', '.ewcpc-popup-overlay', function(e) {
            if ($(e.target).hasClass('ewcpc-popup-overlay')) {
                closePopup();
            }
        });

        // Close popup on ESC key
        $(document).off('keydown.ewcpc').on('keydown.ewcpc', function(e) {
            if (e.key === 'Escape' && $('#ewcpc-popup').is(':visible')) {
                closePopup();
            }
        });

        // Handle form submission
        $('#ewcpc-product-form').off('submit.ewcpc').on('submit.ewcpc', function(e) {
            e.preventDefault();

            var $form = $(this);
            var $submitBtn = $form.find('.ewcpc-btn-submit');
            var $message = $('#ewcpc-form-message');
            var productName = $('#ewcpc-product-name').val().trim();
            var productPrice = $('#ewcpc-product-price').val();

            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                errorProductName: 'Please enter product name.',
                errorProductPrice: 'Please enter a valid product price.',
                creating: 'Creating...',
                save: 'Save',
                errorConnection: 'An error occurred while connecting to the server.',
                errorGeneral: 'An error occurred.',
                successCreated: 'Product has been created and selected automatically!',
                loading: 'Loading...',
                product: 'Product'
            };

            // Validation
            if (!productName) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorProductName);
                return;
            }

            if (!productPrice || parseFloat(productPrice) <= 0) {
                $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorProductPrice);
                return;
            }

            // Disable submit button
            $submitBtn.prop('disabled', true).text(strings.creating);
            $message.removeClass('ewcpc-success ewcpc-error').text('');

            // AJAX request
            $.ajax({
                url: ewcpcAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ewcpc_create_product',
                    nonce: ewcpcAjax.nonce,
                    product_name: productName,
                    product_price: productPrice
                },
                success: function(response) {
                    if (response.success) {
                        $message.removeClass('ewcpc-error').addClass('ewcpc-success').text(response.data.message);
                        
                        var newProductId = response.data.product_id;
                        var newProductName = response.data.product_name;
                        var newProductPrice = response.data.product_price;
                        
                        var currencySymbol = '₫'; 
                        var formattedPrice = parseFloat(newProductPrice).toLocaleString('vi-VN') + ' ' + currencySymbol;
                        var displayText = newProductName + ' - ' + formattedPrice;
                        
                        var priceHtml = '<span class="woocommerce-Price-amount amount"><bdi>' + 
                                       parseFloat(newProductPrice).toLocaleString('vi-VN') + 
                                       ' <span class="woocommerce-Price-currencySymbol">' + currencySymbol + '</span></bdi></span>';
                        
                        closePopup();
                        
                        // First, add new product to cache immediately
                        if (!productsListCache.data) {
                            productsListCache.data = {};
                        }
                        productsListCache.data[newProductId] = displayText;
                        
                        // Update widget settings first
                        if (currentWidgetContainer && typeof $e !== 'undefined' && $e.run) {
                            try {
                                // Update widget settings with new product
                                $e.run('document/elements/settings', {
                                    container: currentWidgetContainer,
                                    settings: {
                                        product_id: newProductId.toString()
                                    }
                                });

                                // Update layout widget immediately
                                setTimeout(function() {
                                    if (currentWidgetContainer && currentWidgetContainer.model) {
                                        var elementId = currentWidgetContainer.model.get('id');
                                        var $widgetElement = elementor.$previewContents.find('[data-id="' + elementId + '"]');
                                        if ($widgetElement.length) {
                                            var $productDisplay = $widgetElement.find('.ewcpc-product-display');
                                            if ($productDisplay.length) {
                                                $productDisplay.html(
                                                    '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                    '<div class="ewcpc-product-price">' + priceHtml + '</div>'
                                                );
                                            } else {
                                                // If display doesn't exist, create it
                                                $widgetElement.append(
                                                    '<div class="ewcpc-product-display">' +
                                                        '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                        '<div class="ewcpc-product-price">' + priceHtml + '</div>' +
                                                    '</div>'
                                                );
                                            }
                                        }
                                    }
                                }, 50);
                            } catch (e) {
                                console.log('Error updating widget settings:', e);
                                // Fallback: try to get container from model
                                if (currentWidgetModel && typeof $e !== 'undefined' && $e.components) {
                                    try {
                                        var elementId = currentWidgetModel.get('id');
                                        var container = $e.components.get('document/elements').getContainer(elementId);
                                        if (container) {
                                            $e.run('document/elements/settings', {
                                                container: container,
                                                settings: {
                                                    product_id: newProductId.toString()
                                                }
                                            });
                                        }
                                    } catch (e2) {
                                        console.log('Error with fallback container:', e2);
                                    }
                                }
                            }
                        } else if (currentWidgetModel && typeof $e !== 'undefined' && $e.run && $e.components) {
                            // Try to get container from model ID
                            try {
                                var elementId = currentWidgetModel.get('id');
                                var container = $e.components.get('document/elements').getContainer(elementId);
                                if (container) {
                                    $e.run('document/elements/settings', {
                                        container: container,
                                        settings: {
                                            product_id: newProductId.toString()
                                        }
                                    });
                                    
                                    // Update layout widget
                                    setTimeout(function() {
                                        var elementId = currentWidgetModel.get('id');
                                        var $widgetElement = elementor.$previewContents.find('[data-id="' + elementId + '"]');
                                        if ($widgetElement.length) {
                                            var $productDisplay = $widgetElement.find('.ewcpc-product-display');
                                            if ($productDisplay.length) {
                                                $productDisplay.html(
                                                    '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                    '<div class="ewcpc-product-price">' + priceHtml + '</div>'
                                                );
                                            } else {
                                                $widgetElement.append(
                                                    '<div class="ewcpc-product-display">' +
                                                        '<h3 class="ewcpc-product-name">' + newProductName + '</h3>' +
                                                        '<div class="ewcpc-product-price">' + priceHtml + '</div>' +
                                                    '</div>'
                                                );
                                            }
                                        }
                                    }, 50);
                                }
                            } catch (e) {
                                console.log('Error getting container from model:', e);
                            }
                        }
                        
                        // Refresh products list and update all selects
                        refreshProductsListCache(function(products) {
                            if (products) {
                                // Preserve current values of all selects except current widget
                                var preserveValues = {};
                                $('.elementor-control-product_id select').each(function() {
                                    var $select = $(this);
                                    var controlId = $select.closest('.elementor-control').data('id');
                                    if (controlId) {
                                        preserveValues[controlId] = $select.val();
                                    }
                                });

                                // Update all select controls with new products list
                                updateAllSelectControls(products, preserveValues);

                                // Auto-select new product in current widget's select
                                setTimeout(function() {
                                    var $currentSelect = $('.elementor-control-product_id select').filter(function() {
                                        var $select = $(this);
                                        var $control = $select.closest('.elementor-control');
                                        return $control.length > 0;
                                    }).first();

                                    if ($currentSelect.length) {
                                        // Ensure new product option exists
                                        if ($currentSelect.find('option[value="' + newProductId + '"]').length === 0) {
                                            var $newOption = $('<option></option>')
                                                .attr('value', newProductId)
                                                .text(displayText);
                                            $currentSelect.append($newOption);
                                        }
                                        
                                        // Select the new product
                                        $currentSelect.val(newProductId);
                                        
                                        // Update Select2 if initialized
                                        if ($currentSelect.data('select2')) {
                                            $currentSelect.trigger('change');
                                        } else if (typeof $currentSelect.select2 === 'function') {
                                            $currentSelect.select2();
                                            $currentSelect.val(newProductId).trigger('change');
                                        }
                                    }
                                }, 150);
                                
                                // Also update all other select controls to include new product
                                setTimeout(function() {
                                    $('.elementor-control-product_id select').each(function() {
                                        var $select = $(this);
                                        if ($select.find('option[value="' + newProductId + '"]').length === 0) {
                                            var $newOption = $('<option></option>')
                                                .attr('value', newProductId)
                                                .text(displayText);
                                            $select.append($newOption);
                                            
                                            // Refresh Select2 if initialized
                                            if ($select.data('select2')) {
                                                $select.select2('destroy');
                                                setTimeout(function() {
                                                    if (typeof $select.select2 === 'function') {
                                                        $select.select2();
                                                    }
                                                }, 10);
                                            }
                                        }
                                    });
                                }, 200);
                            }
                        });
                        
                        if (elementor.notifications) {
                            var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                                successCreated: 'Product has been created and selected automatically!'
                            };
                            elementor.notifications.showToast({
                                message: strings.successCreated,
                                type: 'success'
                            });
                        }
                    } else {
                        var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                            errorGeneral: 'An error occurred.',
                            save: 'Save'
                        };
                        $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(response.data.message || strings.errorGeneral);
                        $submitBtn.prop('disabled', false).text(strings.save);
                    }
                },
                error: function() {
                    var strings = typeof ewcpcStrings !== 'undefined' ? ewcpcStrings : {
                        errorConnection: 'An error occurred while connecting to the server.',
                        save: 'Save'
                    };
                    $message.removeClass('ewcpc-success').addClass('ewcpc-error').text(strings.errorConnection);
                    $submitBtn.prop('disabled', false).text(strings.save);
                }
            });
        });
    }

    // Function to load products list into select control
    function loadProductsList(panel, forceRefresh) {
        var $productControl = panel.$el.find('.elementor-control-product_id');
        var $productSelect = $productControl.find('select');
        
        if (!$productSelect.length) {
            setTimeout(function() {
                loadProductsList(panel, forceRefresh);
            }, 100);
            return;
        }

        // Check if select already has products
        var optionCount = $productSelect.find('option').length;
        var hasProducts = false;
        
        $productSelect.find('option').each(function() {
            var val = $(this).val();
            if (val && val !== '' && val !== '0') {
                hasProducts = true;
                return false;
            }
        });

        // If already has products and not forcing refresh, just ensure Select2 is initialized
        if (hasProducts && optionCount > 1 && !forceRefresh) {
            if (typeof $productSelect.select2 === 'function' && !$productSelect.data('select2')) {
                setTimeout(function() {
                    if (!$productSelect.data('select2')) {
                        $productSelect.select2();
                    }
                }, 50);
            }
            return;
        }
        
        // Get products from cache or server
        getProductsList(forceRefresh, function(products) {
            if (!products) {
                return;
            }

            // Get current selected value to restore later
            var currentValue = $productSelect.val();

            // Clear all existing options
            $productSelect.empty();

            // Add empty option first
            $productSelect.append($('<option></option>').attr('value', '').text(''));

            // Add all products
            $.each(products, function(id, text) {
                var $option = $('<option></option>')
                    .attr('value', id)
                    .text(text);
                $productSelect.append($option);
            });

            // Restore selected value if it exists and is still valid
            if (currentValue && products[currentValue]) {
                $productSelect.val(currentValue);
            }

            // Initialize Select2 if not already done
            if ($productSelect.data('select2')) {
                $productSelect.select2('destroy');
            }
            
            setTimeout(function() {
                if (typeof $productSelect.select2 === 'function') {
                    $productSelect.select2();
                    if (currentValue && products[currentValue]) {
                        $productSelect.val(currentValue).trigger('change');
                    }
                }
            }, 50);
        });
    }

    // Function to auto-select product in select when widget is clicked
    function autoSelectProductForWidget(widgetModel) {
        if (!widgetModel) {
            return;
        }

        var productId = widgetModel.getSetting('product_id');
        if (!productId) {
            return;
        }

        setTimeout(function() {
            var $productSelect = $('.elementor-control-product_id select');
            if ($productSelect.length) {
                // Ensure products list is loaded
                getProductsList(false, function(products) {
                    if (products && products[productId]) {
                        // Check if option exists, if not add it
                        if ($productSelect.find('option[value="' + productId + '"]').length === 0) {
                            var productText = products[productId];
                            var $option = $('<option></option>')
                                .attr('value', productId)
                                .text(productText);
                            $productSelect.append($option);
                        }

                        // Select the product
                        $productSelect.val(productId);
                        if ($productSelect.data('select2')) {
                            $productSelect.trigger('change');
                        }
                    }
                });
            }
        }, 300);
    }

    // Function to auto-select next product for new widget
    function autoSelectNextProductForNewWidget(panel, model) {
        if (!model) {
            return;
        }

        // Check if widget already has a product selected
        var currentProductId = model.getSetting('product_id');
        if (currentProductId) {
            return; // Already has product, don't change
        }

        // Get products list and find next product number
        getProductsList(false, function(products) {
            if (!products || Object.keys(products).length === 0) {
                return;
            }

            var nextNumber = getNextProductNumber(products);
            var nextProductId = findProductIdByNumber(products, nextNumber);

            if (nextProductId) {
                // Update widget settings
                if (typeof $e !== 'undefined' && $e.run && $e.components) {
                    try {
                        var elementId = model.get('id');
                        var container = $e.components.get('document/elements').getContainer(elementId);
                        if (container) {
                            $e.run('document/elements/settings', {
                                container: container,
                                settings: {
                                    product_id: nextProductId.toString()
                                }
                            });
                        }
                    } catch (e) {
                        console.log('Error updating widget settings:', e);
                    }
                }

                // Update select in panel
                setTimeout(function() {
                    var $productSelect = panel.$el.find('.elementor-control-product_id select');
                    if ($productSelect.length) {
                        // Ensure option exists
                        if ($productSelect.find('option[value="' + nextProductId + '"]').length === 0) {
                            var productText = products[nextProductId];
                            var $option = $('<option></option>')
                                .attr('value', nextProductId)
                                .text(productText);
                            $productSelect.append($option);
                        }

                        $productSelect.val(nextProductId);
                        if ($productSelect.data('select2')) {
                            $productSelect.trigger('change');
                        }
                    }
                }, 200);
            }
        });
    }

    // Function to initialize event listeners
    function initProductCreator() {
        $(document).off('click', '.elementor-button[data-event="ewcpc:create_product"]')
                   .on('click', '.elementor-button[data-event="ewcpc:create_product"]', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openCreateProductPopup();
        });
    }

    // Initialize when Elementor is ready
    $(document).ready(function() {
        if (typeof elementor !== 'undefined') {
            initProductCreator();
            setupElementorHooks();
        } else {
            $(window).on('elementor:init', function() {
                initProductCreator();
                setupElementorHooks();
            });
        }
    });
    
    // Setup Elementor hooks
    function setupElementorHooks() {
        if (!elementor.hooks) {
            return;
        }
        
        // Track current widget when panel opens
        elementor.hooks.addAction('panel/open_editor/widget/ewcpc_product_creator', function(panel, model, view) {
            // Store current widget model
            currentWidgetModel = model;
            
            // Try to get container from view or model
            try {
                if (view && view.getContainer) {
                    currentWidgetContainer = view.getContainer();
                } else if (model && typeof $e !== 'undefined' && $e.components) {
                    var elementId = model.get('id');
                    var container = $e.components.get('document/elements').getContainer(elementId);
                    if (container) {
                        currentWidgetContainer = container;
                    }
                }
            } catch (e) {
                console.log('Error getting container:', e);
            }

            setTimeout(function() {
                var $button = panel.$el.find('[data-event="ewcpc:create_product"]');
                if ($button.length) {
                    $button.off('click.ewcpc').on('click.ewcpc', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        openCreateProductPopup();
                    });
                }
                
                // Load products list if needed
                loadProductsList(panel, false);
                
                // Auto-select product for this widget
                autoSelectProductForWidget(model);
            }, 200);
        });
        
        // Listen for any widget panel opening
        elementor.hooks.addAction('panel/open_editor/widget', function(panel, model, view) {
            if (model && model.get('widgetType') === 'ewcpc_product_creator') {
                // Store current widget model
                currentWidgetModel = model;
                
                // Try to get container from view or model
                try {
                    if (view && view.getContainer) {
                        currentWidgetContainer = view.getContainer();
                    } else if (model && typeof $e !== 'undefined' && $e.components) {
                        var elementId = model.get('id');
                        var container = $e.components.get('document/elements').getContainer(elementId);
                        if (container) {
                            currentWidgetContainer = container;
                        }
                    }
                } catch (e) {
                    console.log('Error getting container:', e);
                }

                setTimeout(function() {
                    // Load products list if needed
                    loadProductsList(panel, false);
                    
                    // Auto-select product for this widget
                    autoSelectProductForWidget(model);
                    
                    // If new widget (no product selected), auto-select next product
                    autoSelectNextProductForNewWidget(panel, model);
                }, 400);
            }
        });
        
        // Listen for element selection - auto-select product when clicking widget
        if (elementor.on) {
            elementor.on('element:selected', function(view) {
                if (view && view.model && view.model.get('widgetType') === 'ewcpc_product_creator') {
                    // Store current widget model
                    currentWidgetModel = view.model;
                    
                    // Try to get container from view
                    try {
                        if (view.getContainer) {
                            currentWidgetContainer = view.getContainer();
                        } else if (view.model && typeof $e !== 'undefined' && $e.components) {
                            var elementId = view.model.get('id');
                            var container = $e.components.get('document/elements').getContainer(elementId);
                            if (container) {
                                currentWidgetContainer = container;
                            }
                        }
                    } catch (e) {
                        console.log('Error getting container:', e);
                    }

                    setTimeout(function() {
                        var panel = elementor.getPanelView();
                        if (panel) {
                            // Load products list if needed
                            loadProductsList(panel, false);
                            
                            // Auto-select product for this widget
                            autoSelectProductForWidget(view.model);
                        }
                    }, 300);
                }
            });
        }

        // Listen for new widget being added
        if (elementor.on) {
            elementor.on('document/elements/create', function(model) {
                if (model && model.get('widgetType') === 'ewcpc_product_creator') {
                    // Store as current widget model
                    currentWidgetModel = model;
                    
                    // Try to get container from model
                    try {
                        if (typeof $e !== 'undefined' && $e.components) {
                            var elementId = model.get('id');
                            var container = $e.components.get('document/elements').getContainer(elementId);
                            if (container) {
                                currentWidgetContainer = container;
                            }
                        }
                    } catch (e) {
                        console.log('Error getting container:', e);
                    }

                    // When panel opens for this new widget, auto-select next product
                    setTimeout(function() {
                        var panel = elementor.getPanelView();
                        if (panel) {
                            autoSelectNextProductForNewWidget(panel, model);
                        }
                    }, 500);
                }
            });
        }
    }

})(jQuery);
