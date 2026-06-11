/* ============================================================
   #IYKYK — Main JavaScript
   Scroll observers, toggle logic, cart drawer, animations
   ============================================================ */

(function () {
  'use strict';

  // --- State ---
  const state = {
    selectedColor: 'black',
    selectedSize: null,
    cartQuantity: 0,
    cartItem: null,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  // --- DOM Cache ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const nav = $('#nav');
  const hero = $('#hero');
  const heroContent = $('#hero-content');
  const colorwaySection = $('#colorway');
  const stickyCta = $('#sticky-cta');
  const cartOverlay = $('#cart-overlay');
  const cartDrawer = $('#cart-drawer');
  const cartBody = $('#cart-body');
  const cartFooter = $('#cart-footer');
  const cartSubtotal = $('#cart-subtotal');
  const checkoutBtn = $('#checkout-btn');
  const addToBtn = $('#add-to-bag');
  const addBtnText = $('#add-btn-text');
  const sizeHelper = $('#size-helper');
  const sizeGuideToggle = $('#size-guide-toggle');
  const sizeGuidePanel = $('#size-guide-panel');

  const PRICE = 2499;

  // ============================================================
  // 1. Scroll-triggered Fade Animations
  // ============================================================
  function initScrollAnimations() {
    const fadeElements = $$('.fade-up, .fade-in');
    if (!fadeElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    fadeElements.forEach((el) => observer.observe(el));
  }

  // ============================================================
  // 2. Nav Visibility (appears after scrolling past hero)
  // ============================================================
  function initNavObserver() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          nav.classList.remove('visible');
        } else {
          nav.classList.add('visible');
        }
      },
      { threshold: 0 }
    );

    observer.observe(hero);
  }

  // ============================================================
  // 3. Hero Parallax (text moves up at 0.5x scroll speed)
  // ============================================================
  function initHeroParallax() {
    if (state.reducedMotion) return;

    let ticking = false;

    function updateParallax() {
      const scrollY = window.scrollY;
      const heroHeight = hero.offsetHeight;

      if (scrollY < heroHeight) {
        const offset = scrollY * 0.5;
        heroContent.style.transform = `translateY(-${offset}px)`;
      }
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================================
  // 4. Colorway Toggle (Section 3 + Buy Module sync)
  // ============================================================
  function setColorway(color) {
    state.selectedColor = color;

    // Section 3 — colorway images
    const colorwayBlack = $('#colorway-img-black');
    const colorwayWhite = $('#colorway-img-white');
    const colorwayLabel = $('#colorway-label');

    if (color === 'black') {
      colorwayBlack.classList.remove('hidden');
      colorwayWhite.classList.add('hidden');
      colorwayLabel.textContent = 'Pure Black';
    } else {
      colorwayBlack.classList.add('hidden');
      colorwayWhite.classList.remove('hidden');
      colorwayLabel.textContent = 'Pure White';
    }

    // Dots — Section 3
    $$('.colorway__dot').forEach((dot) => {
      const isActive = dot.dataset.color === color;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-checked', isActive.toString());
    });

    // Buy module — images
    const buyBlack = $('#buy-img-black');
    const buyWhite = $('#buy-img-white');

    if (color === 'black') {
      buyBlack.classList.remove('hidden');
      buyWhite.classList.add('hidden');
    } else {
      buyBlack.classList.add('hidden');
      buyWhite.classList.remove('hidden');
    }

    // Buy module — dots & label
    $$('.buy__color-dot').forEach((dot) => {
      const isActive = dot.dataset.color === color;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-checked', isActive.toString());
    });

    const buyLabel = $('#buy-color-label');
    buyLabel.textContent = color === 'black' ? 'Pure Black' : 'Pure White';
  }

  function initColorwayToggle() {
    // Section 3 dots
    $$('.colorway__dot').forEach((dot) => {
      dot.addEventListener('click', () => setColorway(dot.dataset.color));
    });

    // Buy module dots
    $$('.buy__color-dot').forEach((dot) => {
      dot.addEventListener('click', () => setColorway(dot.dataset.color));
    });

    // Swipe support on colorway images
    const imageContainer = $('#colorway-images');
    let touchStartX = 0;

    imageContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    imageContainer.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          setColorway('white');
        } else {
          setColorway('black');
        }
      }
    }, { passive: true });
  }

  // ============================================================
  // 5. Macro Image Scroll Zoom
  // ============================================================
  function initMacroZoom() {
    if (state.reducedMotion) return;

    const macroFrames = $$('.macro-frame, .editorial');

    macroFrames.forEach((frame) => {
      const img = frame.querySelector('.macro-frame__image, .editorial__image');

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const updateZoom = () => {
              const rect = frame.getBoundingClientRect();
              const vh = window.innerHeight;
              const progress = 1 - (rect.top / vh);
              const clampedProgress = Math.max(0, Math.min(1, progress));
              const scale = 1 + (clampedProgress * 0.06);
              img.style.transform = `scale(${scale})`;

              if (rect.bottom > 0 && rect.top < vh) {
                requestAnimationFrame(updateZoom);
              }
            };
            requestAnimationFrame(updateZoom);
          }
        },
        { threshold: 0 }
      );

      observer.observe(frame);
    });
  }

  // ============================================================
  // 6. Size Selection
  // ============================================================
  function initSizeSelection() {
    const sizePills = $$('.buy__size-pill');

    sizePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        // Clear all
        sizePills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-checked', 'false');
        });

        // Set active
        pill.classList.add('active');
        pill.setAttribute('aria-checked', 'true');
        state.selectedSize = pill.dataset.size;

        // Enable CTA
        addToBtn.disabled = false;
        addToBtn.classList.remove('disabled');
        sizeHelper.textContent = '';
      });
    });
  }

  // ============================================================
  // 7. Add to Bag & Cart Drawer
  // ============================================================
  function formatPrice(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  function openCartDrawer() {
    cartOverlay.classList.add('open');
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartOverlay.classList.remove('open');
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateCart() {
    if (!state.cartItem) {
      cartBody.innerHTML = '<p style="color:#86868B;text-align:center;padding:40px 0;">Your bag is empty.</p>';
      cartFooter.style.display = 'none';
      return;
    }

    const item = state.cartItem;
    const total = item.quantity * PRICE;
    const imgSrc = item.color === 'black' ? 'assets/tee-black-buy.jpg' : 'assets/tee-white-buy.jpg';
    const colorLabel = item.color === 'black' ? 'Pure Black' : 'Pure White';

    cartBody.innerHTML = `
      <div class="cart-item">
        <img src="${imgSrc}" alt="${colorLabel} #IYKYK Tee" class="cart-item__image">
        <div class="cart-item__details">
          <p class="cart-item__name">The #IYKYK Tee</p>
          <p class="cart-item__meta">${colorLabel} · ${item.size}</p>
          <div class="cart-item__quantity">
            <button class="cart-item__qty-btn" id="qty-minus" aria-label="Decrease quantity">−</button>
            <span class="cart-item__qty-count" id="qty-count">${item.quantity}</span>
            <button class="cart-item__qty-btn" id="qty-plus" aria-label="Increase quantity">+</button>
          </div>
          <p class="cart-item__price">${formatPrice(total)}</p>
        </div>
      </div>
    `;

    cartFooter.style.display = 'block';
    cartSubtotal.textContent = formatPrice(total);
    checkoutBtn.textContent = `Checkout — ${formatPrice(total)}`;

    // Attach quantity handlers
    $('#qty-minus').addEventListener('click', () => {
      if (state.cartItem.quantity > 1) {
        state.cartItem.quantity--;
        updateCart();
      } else {
        state.cartItem = null;
        state.cartQuantity = 0;
        updateCart();
      }
    });

    $('#qty-plus').addEventListener('click', () => {
      if (state.cartItem.quantity < 10) {
        state.cartItem.quantity++;
        updateCart();
      }
    });
  }

  function initAddToBag() {
    addToBtn.addEventListener('click', () => {
      if (!state.selectedSize) return;

      // Add item
      state.cartItem = {
        color: state.selectedColor,
        size: state.selectedSize,
        quantity: 1,
      };
      state.cartQuantity = 1;

      // Button morph: "Added ✓"
      addBtnText.textContent = 'Added ✓';
      addToBtn.style.background = '#1d1d1f';

      setTimeout(() => {
        addBtnText.textContent = 'Add to Bag — ₹2,499';
        addToBtn.style.background = '';
      }, 1200);

      // Open drawer after a beat
      setTimeout(() => {
        updateCart();
        openCartDrawer();
      }, 400);
    });

    // Close handlers
    $('#cart-close').addEventListener('click', closeCartDrawer);
    cartOverlay.addEventListener('click', closeCartDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartDrawer.classList.contains('open')) {
        closeCartDrawer();
      }
    });

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
      checkoutBtn.textContent = 'Coming soon';
      checkoutBtn.style.opacity = '0.6';
      setTimeout(() => {
        const total = state.cartItem ? state.cartItem.quantity * PRICE : PRICE;
        checkoutBtn.textContent = `Checkout — ${formatPrice(total)}`;
        checkoutBtn.style.opacity = '';
      }, 2000);
    });
  }

  // ============================================================
  // 8. Size Guide Panel
  // ============================================================
  function initSizeGuide() {
    sizeGuideToggle.addEventListener('click', () => {
      const isExpanded = sizeGuidePanel.classList.toggle('expanded');
      sizeGuideToggle.setAttribute('aria-expanded', isExpanded.toString());
      sizeGuideToggle.textContent = isExpanded ? 'Close size guide' : 'Size guide';
    });

    // Footer "Size Guide" link also triggers it
    const footerSizeGuide = $('#footer-size-guide');
    if (footerSizeGuide) {
      footerSizeGuide.addEventListener('click', (e) => {
        e.preventDefault();
        const specsSection = $('#specs');
        specsSection.scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
          if (!sizeGuidePanel.classList.contains('expanded')) {
            sizeGuidePanel.classList.add('expanded');
            sizeGuideToggle.setAttribute('aria-expanded', 'true');
            sizeGuideToggle.textContent = 'Close size guide';
          }
        }, 800);
      });
    }
  }

  // ============================================================
  // 9. Mobile Sticky CTA
  // ============================================================
  function initStickyCta() {
    if (!stickyCta) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky CTA only when colorway section has been passed
        // and buy section isn't fully visible
        if (!entry.isIntersecting) {
          stickyCta.classList.add('visible');
        } else {
          stickyCta.classList.remove('visible');
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(colorwaySection);

    // Also hide when buy section is visible
    const buySection = $('#buy');
    const buyObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stickyCta.classList.remove('visible');
        }
      },
      { threshold: 0.2 }
    );

    buyObserver.observe(buySection);
  }

  // ============================================================
  // 10. Smooth Scroll for anchor links
  // ============================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
          const navOffset = nav.classList.contains('visible') ? 56 : 0;
          const top = target.getBoundingClientRect().top + window.scrollY - navOffset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================================
  // Initialize Everything
  // ============================================================
  function init() {
    initScrollAnimations();
    initNavObserver();
    initHeroParallax();
    initColorwayToggle();
    initMacroZoom();
    initSizeSelection();
    initAddToBag();
    initSizeGuide();
    initStickyCta();
    initSmoothScroll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
