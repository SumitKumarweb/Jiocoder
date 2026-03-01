(function() {
  'use strict';

  class MobileMenu {
    constructor() {
      this.menu = document.getElementById('mobile-menu');
      this.overlay = document.getElementById('mobile-menu-overlay');
      this.closeBtn = document.getElementById('mobile-menu-close');
      this.isOpen = false;

      this.init();
    }

    init() {
      if (!this.menu) return;

      // Close button
      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Overlay click to close
      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }

      // ESC key to close
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });

      // Listen for open events
      document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-mobile-menu-trigger]');
        if (trigger) {
          e.preventDefault();
          this.open();
        }
      });

      // Listen for custom open event
      document.addEventListener('mobile-menu:open', () => this.open());
      document.addEventListener('mobile-menu:close', () => this.close());
    }

    open() {
      if (!this.menu || this.isOpen) return;

      this.isOpen = true;
      
      if (this.overlay) {
        this.overlay.classList.remove('hidden');
      }
      
      this.menu.classList.remove('-translate-x-full');
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('mobile-menu:opened'));
    }

    close() {
      if (!this.menu || !this.isOpen) return;

      this.isOpen = false;
      
      this.menu.classList.add('-translate-x-full');
      
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.classList.add('hidden');
        }
        document.body.style.overflow = '';
      }, 300);

      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('mobile-menu:closed'));
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  // Initialize mobile menu
  let mobileMenuInstance = null;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mobileMenuInstance = new MobileMenu();
      window.mobileMenu = mobileMenuInstance;
    });
  } else {
    mobileMenuInstance = new MobileMenu();
    window.mobileMenu = mobileMenuInstance;
  }
})();

