(function() {
  'use strict';

  function initProductDetails() {
    const productContainer = document.querySelector('[data-product-id]');
    if (!productContainer) return;

    // Get product data
    const productId = productContainer.dataset.productId;
    const variants = JSON.parse(productContainer.dataset.productVariants || '[]');
    const options = JSON.parse(productContainer.dataset.productOptions || '[]');
    
    // State management
    let selectedOptions = {};
    let currentVariant = null;
    let quantity = 1;

    // Initialize selected options from default variant
    // This will be set from the initial state in the HTML
    const initialOptions = productContainer.dataset.initialOptions;
    if (initialOptions) {
      try {
        selectedOptions = JSON.parse(initialOptions);
      } catch (e) {
        console.error('Error parsing initial options:', e);
      }
    }

    // Find variant based on selected options
    function findVariant() {
      if (variants.length === 0) return null;
      
      // If only one variant, return it
      if (variants.length === 1) return variants[0];
      
      // Find matching variant
      return variants.find(variant => {
        return options.every((option, index) => {
          const optionName = option.name;
          const selectedValue = selectedOptions[optionName];
          const variantOptionValue = variant.options[index];
          return variantOptionValue === selectedValue;
        });
      }) || variants[0];
    }

    // Update variant and UI
    function updateVariant() {
      currentVariant = findVariant();
      
      if (currentVariant) {
        // Console log the selected variant
        console.log('Selected Variant:', {
          id: currentVariant.id,
          title: currentVariant.title,
          price: currentVariant.price,
          compare_at_price: currentVariant.compare_at_price,
          available: currentVariant.available,
          options: currentVariant.options,
          selectedOptions: selectedOptions
        });

        // Update hidden inputs in forms
        const cartVariantInput = document.getElementById('cart-variant-id');
        const buyNowVariantInput = document.getElementById('buy-now-variant-id');
        
        if (cartVariantInput) cartVariantInput.value = currentVariant.id;
        if (buyNowVariantInput) buyNowVariantInput.value = currentVariant.id;

        // Update price display
        const priceElement = document.querySelector('.text-4xl.font-black.text-primary');
        if (priceElement && currentVariant.price) {
          const formattedPrice = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
          }).format(currentVariant.price / 100);
          priceElement.textContent = formattedPrice;
        }

        // Update compare at price if exists
        if (currentVariant.compare_at_price && currentVariant.compare_at_price > currentVariant.price) {
          const comparePriceElement = document.querySelector('.text-lg.text-slate-400.line-through');
          if (comparePriceElement) {
            const formattedComparePrice = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0
            }).format(currentVariant.compare_at_price / 100);
            comparePriceElement.textContent = formattedComparePrice;
          }

          // Update discount percentage
          const discountPercentage = Math.round(
            ((currentVariant.compare_at_price - currentVariant.price) / currentVariant.compare_at_price) * 100
          );
          const discountElement = document.querySelector('.bg-emerald-100.text-emerald-700');
          if (discountElement) {
            discountElement.textContent = discountPercentage + '% OFF';
          }
        }

        // Update availability
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');
        
        if (addToCartBtn) {
          addToCartBtn.disabled = !currentVariant.available;
          if (!currentVariant.available) {
            addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            addToCartBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        }
        if (buyNowBtn) {
          buyNowBtn.disabled = !currentVariant.available;
          if (!currentVariant.available) {
            buyNowBtn.classList.add('opacity-50', 'cursor-not-allowed');
          } else {
            buyNowBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        }

        // Update stock status
        const stockStatus = document.querySelector('.text-emerald-600');
        if (stockStatus) {
          const statusText = stockStatus.querySelector('span:last-child') || stockStatus;
          if (statusText) {
            statusText.textContent = currentVariant.available ? 'In Stock' : 'Out of Stock';
            if (!currentVariant.available) {
              stockStatus.classList.remove('text-emerald-600');
              stockStatus.classList.add('text-red-600');
            } else {
              stockStatus.classList.remove('text-red-600');
              stockStatus.classList.add('text-emerald-600');
            }
          }
        }
      }
    }

    // Handle variant option clicks
    const variantButtons = productContainer.querySelectorAll('.variant-option-btn');
    variantButtons.forEach(button => {
      button.addEventListener('click', function() {
        const optionName = this.dataset.optionName;
        const optionValue = this.dataset.optionValue;
        
        // Update selected option
        selectedOptions[optionName] = optionValue;
        
        // Update button styles
        const optionGroup = this.closest('.space-y-4 > div');
        if (optionGroup) {
          const buttons = optionGroup.querySelectorAll('.variant-option-btn');
          buttons.forEach(btn => {
            if (btn.dataset.optionName === optionName) {
              if (btn.dataset.optionValue === optionValue) {
                btn.classList.add('border-2', 'border-primary', 'bg-primary/5', 'text-primary');
                btn.classList.remove('border-slate-200');
              } else {
                btn.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'text-primary');
                btn.classList.add('border-slate-200');
              }
            }
          });
        }
        
        // Update variant
        updateVariant();
      });
    });

    // Quantity controls
    const quantityInput = document.getElementById('quantity-input');
    const quantityDecrease = document.getElementById('quantity-decrease');
    const quantityIncrease = document.getElementById('quantity-increase');
    const cartQuantityInput = document.getElementById('cart-quantity');
    const buyNowQuantityInput = document.getElementById('buy-now-quantity');

    function updateQuantity(newQuantity) {
      quantity = Math.max(1, parseInt(newQuantity) || 1);
      if (quantityInput) quantityInput.value = quantity;
      if (cartQuantityInput) cartQuantityInput.value = quantity;
      if (buyNowQuantityInput) buyNowQuantityInput.value = quantity;
      
      console.log('Quantity updated:', quantity);
    }

    if (quantityDecrease) {
      quantityDecrease.addEventListener('click', function(e) {
        e.preventDefault();
        updateQuantity(quantity - 1);
      });
    }

    if (quantityIncrease) {
      quantityIncrease.addEventListener('click', function(e) {
        e.preventDefault();
        updateQuantity(quantity + 1);
      });
    }

    if (quantityInput) {
      quantityInput.addEventListener('change', function() {
        updateQuantity(this.value);
      });

      quantityInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (!isNaN(value) && value >= 1) {
          quantity = value;
          if (cartQuantityInput) cartQuantityInput.value = quantity;
          if (buyNowQuantityInput) buyNowQuantityInput.value = quantity;
        }
      });
    }

    // Initialize variant on page load
    updateVariant();

    // Handle buy now form - should go directly to checkout
    const buyNowForm = document.getElementById('buy-now-form');
    if (buyNowForm) {
      buyNowForm.addEventListener('submit', async (e) => {
        // Don't prevent default - let it submit normally to go to checkout
        // Just ensure variant and quantity are updated
        const variantIdInput = buyNowForm.querySelector('#buy-now-variant-id');
        const quantityInput = buyNowForm.querySelector('#buy-now-quantity');
        
        if (variantIdInput && currentVariant) {
          variantIdInput.value = currentVariant.id;
        }
        if (quantityInput) {
          quantityInput.value = parseInt(document.getElementById('quantity-input')?.value || 1);
        }
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductDetails);
  } else {
    initProductDetails();
  }
})();

