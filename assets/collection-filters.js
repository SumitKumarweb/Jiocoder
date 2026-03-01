/**
 * Collection Filters and Sorting
 * Handles filtering by price, brand, rating, availability and sorting
 */

class CollectionFilters {
  constructor() {
    this.productGrid = document.getElementById('product-grid');
    this.priceSlider = document.getElementById('price-range-slider');
    this.brandFilters = document.querySelectorAll('.brand-filter');
    this.ratingFilters = document.querySelectorAll('.rating-filter');
    this.availabilityFilter = document.getElementById('availability-filter');
    this.sortSelect = document.getElementById('sort-select');
    this.clearFiltersBtn = document.getElementById('clear-filters-btn');
    this.resultsCount = document.getElementById('results-count');
    
    this.products = [];
    this.filteredProducts = [];
    this.currentSort = 'manual';
    
    this.init();
  }
  
  init() {
    if (!this.productGrid) return;
    
    // Get all products from the grid
    this.products = Array.from(this.productGrid.querySelectorAll('.product-item'));
    this.filteredProducts = [...this.products];
    
    // Get initial sort value from select
    if (this.sortSelect) {
      this.currentSort = this.sortSelect.value;
    }
    
    // Initialize event listeners
    this.setupEventListeners();
    
    // Apply initial filters from URL params
    this.applyFiltersFromURL();
  }
  
  setupEventListeners() {
    // Price range slider
    if (this.priceSlider) {
      this.priceSlider.addEventListener('input', (e) => {
        this.updatePriceDisplay(e.target.value);
        this.applyFilters();
      });
    }
    
    // Brand filters
    this.brandFilters.forEach(filter => {
      filter.addEventListener('change', () => this.applyFilters());
    });
    
    // Rating filters
    this.ratingFilters.forEach(filter => {
      filter.addEventListener('click', (e) => {
        e.preventDefault();
        const rating = parseFloat(filter.dataset.rating);
        this.toggleRatingFilter(rating);
        this.applyFilters();
      });
    });
    
    // Availability filter
    if (this.availabilityFilter) {
      this.availabilityFilter.addEventListener('change', () => this.applyFilters());
    }
    
    // Sort select
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortProducts(e.target.value);
      });
    }
    
    // Clear filters button
    if (this.clearFiltersBtn) {
      this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    }
  }
  
  updatePriceDisplay(value) {
    const priceMinDisplay = document.getElementById('price-min-display');
    const priceMaxDisplay = document.getElementById('price-max-display');
    const minPrice = parseFloat(this.priceSlider.dataset.min);
    
    if (priceMinDisplay) {
      priceMinDisplay.textContent = `₹${minPrice.toLocaleString('en-IN')}`;
    }
    if (priceMaxDisplay) {
      priceMaxDisplay.textContent = `₹${parseFloat(value).toLocaleString('en-IN')}+`;
    }
  }
  
  toggleRatingFilter(rating) {
    const filter = Array.from(this.ratingFilters).find(f => parseFloat(f.dataset.rating) === rating);
    if (filter) {
      const isActive = filter.classList.contains('active');
      this.ratingFilters.forEach(f => f.classList.remove('active'));
      if (!isActive) {
        filter.classList.add('active');
      }
    }
  }
  
  applyFilters() {
    this.filteredProducts = [...this.products];
    
    // Filter by price
    if (this.priceSlider) {
      const maxPrice = parseFloat(this.priceSlider.value) * 100; // Convert to cents
      this.filteredProducts = this.filteredProducts.filter(product => {
        const price = parseFloat(product.dataset.price);
        return price <= maxPrice;
      });
    }
    
    // Filter by brand
    const selectedBrands = Array.from(this.brandFilters)
      .filter(f => f.checked)
      .map(f => f.dataset.vendor);
    
    if (selectedBrands.length > 0) {
      this.filteredProducts = this.filteredProducts.filter(product => {
        return selectedBrands.includes(product.dataset.vendor);
      });
    }
    
    // Filter by rating
    const activeRatingFilter = Array.from(this.ratingFilters)
      .find(f => f.classList.contains('active'));
    
    if (activeRatingFilter) {
      const minRating = parseFloat(activeRatingFilter.dataset.rating);
      this.filteredProducts = this.filteredProducts.filter(product => {
        const rating = parseFloat(product.dataset.rating) || 0;
        return rating >= minRating;
      });
    }
    
    // Filter by availability
    if (this.availabilityFilter && this.availabilityFilter.checked) {
      this.filteredProducts = this.filteredProducts.filter(product => {
        return product.dataset.available === 'true';
      });
    }
    
    // Apply current sort after filtering
    if (this.currentSort && this.currentSort !== 'manual') {
      this.sortProducts(this.currentSort);
    } else {
      // Update UI without sorting
      this.updateProductGrid();
      this.updateResultsCount();
      this.updateURL();
    }
  }
  
  sortProducts(sortValue) {
    if (!sortValue) {
      sortValue = this.currentSort || 'manual';
    }
    
    const sorted = [...this.filteredProducts];
    
    switch(sortValue) {
      case 'price-ascending':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.dataset.price) || 0;
          const priceB = parseFloat(b.dataset.price) || 0;
          return priceA - priceB;
        });
        break;
      case 'price-descending':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.dataset.price) || 0;
          const priceB = parseFloat(b.dataset.price) || 0;
          return priceB - priceA;
        });
        break;
      case 'title-ascending':
        sorted.sort((a, b) => {
          const titleA = a.querySelector('h3 a')?.textContent.trim() || a.querySelector('h3')?.textContent.trim() || '';
          const titleB = b.querySelector('h3 a')?.textContent.trim() || b.querySelector('h3')?.textContent.trim() || '';
          return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
        });
        break;
      case 'title-descending':
        sorted.sort((a, b) => {
          const titleA = a.querySelector('h3 a')?.textContent.trim() || a.querySelector('h3')?.textContent.trim() || '';
          const titleB = b.querySelector('h3 a')?.textContent.trim() || b.querySelector('h3')?.textContent.trim() || '';
          return titleB.localeCompare(titleA, undefined, { sensitivity: 'base' });
        });
        break;
      case 'created-descending':
        sorted.sort((a, b) => {
          const createdA = parseFloat(a.dataset.created) || 0;
          const createdB = parseFloat(b.dataset.created) || 0;
          return createdB - createdA;
        });
        break;
      case 'created-ascending':
        sorted.sort((a, b) => {
          const createdA = parseFloat(a.dataset.created) || 0;
          const createdB = parseFloat(b.dataset.created) || 0;
          return createdA - createdB;
        });
        break;
      case 'best-selling':
        // This would require additional data (sales count), for now keep original order
        // Could be implemented with a data-sales attribute if available
        break;
      default:
        // Manual/Featured - keep original order from Liquid
        break;
    }
    
    this.filteredProducts = sorted;
    this.updateProductGrid();
    this.updateResultsCount();
    this.updateURL();
  }
  
  updateProductGrid() {
    if (!this.productGrid) return;
    
    // Hide all products
    this.products.forEach(product => {
      product.style.display = 'none';
    });
    
    // Show filtered products
    this.filteredProducts.forEach(product => {
      product.style.display = 'block';
    });
    
    // If no products match, show message
    if (this.filteredProducts.length === 0) {
      this.showNoResultsMessage();
    } else {
      this.hideNoResultsMessage();
    }
  }
  
  showNoResultsMessage() {
    let message = this.productGrid.querySelector('.no-results-message');
    if (!message) {
      message = document.createElement('div');
      message.className = 'no-results-message col-span-full text-center py-12';
      message.innerHTML = `
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">No products found</h3>
        <p class="text-slate-500">Try adjusting your filters to see more results.</p>
      `;
      this.productGrid.appendChild(message);
    }
    message.style.display = 'block';
  }
  
  hideNoResultsMessage() {
    const message = this.productGrid.querySelector('.no-results-message');
    if (message) {
      message.style.display = 'none';
    }
  }
  
  updateResultsCount() {
    if (!this.resultsCount) return;
    
    const total = this.filteredProducts.length;
    const showing = Math.min(total, this.filteredProducts.length);
    
    this.resultsCount.textContent = `Showing ${showing} of ${total} results`;
  }
  
  clearAllFilters() {
    // Reset price slider
    if (this.priceSlider) {
      this.priceSlider.value = this.priceSlider.max;
      this.updatePriceDisplay(this.priceSlider.value);
    }
    
    // Uncheck brand filters
    this.brandFilters.forEach(filter => {
      filter.checked = false;
    });
    
    // Remove active rating filters
    this.ratingFilters.forEach(filter => {
      filter.classList.remove('active');
    });
    
    // Uncheck availability filter
    if (this.availabilityFilter) {
      this.availabilityFilter.checked = false;
    }
    
    // Reset sort
    if (this.sortSelect) {
      this.sortSelect.value = 'manual';
      this.currentSort = 'manual';
    }
    
    // Apply filters (will reset to original order since sort is manual)
    this.applyFilters();
  }
  
  applyFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Apply price filter
    const maxPrice = urlParams.get('max_price');
    if (maxPrice && this.priceSlider) {
      this.priceSlider.value = maxPrice;
      this.updatePriceDisplay(maxPrice);
    }
    
    // Apply brand filters
    const brands = urlParams.get('brands');
    if (brands) {
      const brandArray = brands.split(',');
      this.brandFilters.forEach(filter => {
        if (brandArray.includes(filter.dataset.vendor)) {
          filter.checked = true;
        }
      });
    }
    
    // Apply rating filter
    const rating = urlParams.get('rating');
    if (rating) {
      const filter = Array.from(this.ratingFilters)
        .find(f => parseFloat(f.dataset.rating) === parseFloat(rating));
      if (filter) {
        filter.classList.add('active');
      }
    }
    
    // Apply availability filter
    const inStock = urlParams.get('in_stock');
    if (inStock === 'true' && this.availabilityFilter) {
      this.availabilityFilter.checked = true;
    }
    
    // Apply sort
    const sort = urlParams.get('sort');
    if (sort && this.sortSelect) {
      this.sortSelect.value = sort;
      this.currentSort = sort;
    } else if (this.sortSelect) {
      // Use the default sort from the select (which comes from Liquid settings)
      this.currentSort = this.sortSelect.value;
    }
    
    // Apply all filters (this will also apply sort if currentSort is set)
    this.applyFilters();
  }
  
  updateURL() {
    const url = new URL(window.location);
    const params = url.searchParams;
    
    // Update price
    if (this.priceSlider) {
      const maxPrice = this.priceSlider.value;
      if (maxPrice !== this.priceSlider.max) {
        params.set('max_price', maxPrice);
      } else {
        params.delete('max_price');
      }
    }
    
    // Update brands
    const selectedBrands = Array.from(this.brandFilters)
      .filter(f => f.checked)
      .map(f => f.dataset.vendor);
    
    if (selectedBrands.length > 0) {
      params.set('brands', selectedBrands.join(','));
    } else {
      params.delete('brands');
    }
    
    // Update rating
    const activeRating = Array.from(this.ratingFilters)
      .find(f => f.classList.contains('active'));
    
    if (activeRating) {
      params.set('rating', activeRating.dataset.rating);
    } else {
      params.delete('rating');
    }
    
    // Update availability
    if (this.availabilityFilter && this.availabilityFilter.checked) {
      params.set('in_stock', 'true');
    } else {
      params.delete('in_stock');
    }
    
    // Update sort
    if (this.sortSelect && this.sortSelect.value !== 'manual') {
      params.set('sort', this.sortSelect.value);
    } else {
      params.delete('sort');
    }
    
    // Update URL without reload
    window.history.replaceState({}, '', url);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CollectionFilters();
  });
} else {
  new CollectionFilters();
}

