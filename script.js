(() => {
  const root = document.documentElement;
  const body = document.body;
  const utilityBar = document.querySelector(".utility-bar");
  const header = document.querySelector("[data-header]");
  const navShell = document.querySelector("[data-nav-shell]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const primaryNavLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-panel a[href^="#"]')];
  const mobileMenuItems = mobileMenu ? [...mobileMenu.querySelectorAll("a, button")] : [];
  const stickyCta = document.querySelector(".mobile-sticky-cta");
  const testimonialTrack = document.querySelector("[data-testimonial-track]");
  const prevButton = document.querySelector("[data-carousel-prev]");
  const nextButton = document.querySelector("[data-carousel-next]");
  const faqItems = [...document.querySelectorAll(".faq-item")];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let headerOffset = 120;
  let scrollFrame = 0;

  const debounce = (callback, delay = 120) => {
    let timeoutId = 0;

    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => callback(...args), delay);
    };
  };

  const getHashTarget = (hash) => {
    if (!hash || hash === "#") return null;
    const id = decodeURIComponent(hash.slice(1));
    return id ? document.getElementById(id) : null;
  };

  const navTargets = [...new Map(
    primaryNavLinks
      .map((link) => {
        const hash = link.getAttribute("href");
        const target = getHashTarget(hash);
        return target ? [hash, target] : null;
      })
      .filter(Boolean)
  ).entries()].sort(([, firstTarget], [, secondTarget]) => {
    if (firstTarget === secondTarget) return 0;
    return firstTarget.compareDocumentPosition(secondTarget) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  const isMenuOpen = () => toggle?.getAttribute("aria-expanded") === "true";

  const syncHeaderOffset = () => {
    const utilityBarHeight = utilityBar?.offsetHeight || 0;
    const measuredHeight = navShell?.offsetHeight || header?.offsetHeight || 0;
    root.style.setProperty("--utility-bar-height", `${utilityBarHeight}px`);
    headerOffset = Math.max(120, Math.ceil(utilityBarHeight + measuredHeight + 24));
    root.style.setProperty("--header-offset", `${headerOffset}px`);
    return headerOffset;
  };

  const getDocumentTop = (element) => {
    if (!element) return 0;

    let current = element;
    let top = 0;

    while (current instanceof HTMLElement) {
      top += current.offsetTop;
      current = current.offsetParent;
    }

    return top;
  };

  const setMobileMenuTabbability = (isOpen) => {
    mobileMenuItems.forEach((item) => {
      if (isOpen) {
        item.removeAttribute("tabindex");
      } else {
        item.setAttribute("tabindex", "-1");
      }
    });
  };

  const setMenuOpen = (isOpen, options = {}) => {
    if (!toggle || !mobileMenu) return;

    const { focusFirstLink = false, restoreFocus = false } = options;

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("is-open", isOpen);
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    body.classList.toggle("menu-open", isOpen);
    setMobileMenuTabbability(isOpen);

    if ("inert" in mobileMenu) {
      mobileMenu.inert = !isOpen;
    }

    if (isOpen && focusFirstLink) {
      mobileMenuItems[0]?.focus({ preventScroll: true });
    }

    if (!isOpen && restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  const updateHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const updateStickyCta = () => {
    if (!stickyCta) return;
    const shouldShow = window.innerWidth < 768 && window.scrollY > 520 && !isMenuOpen();
    stickyCta.classList.toggle("is-visible", shouldShow);
  };

  const setActiveNavLink = (activeHash) => {
    primaryNavLinks.forEach((link) => {
      const isActive = Boolean(activeHash) && link.getAttribute("href") === activeHash;
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveNav = () => {
    if (!navTargets.length) return;

    const activationLine = window.scrollY + headerOffset + 32;
    let activeHash = "";

    navTargets.forEach(([hash, target]) => {
      const targetTop = getDocumentTop(target);
      if (targetTop <= activationLine) {
        activeHash = hash;
      }
    });

    if (window.scrollY < 48) {
      activeHash = "";
    }

    const nearPageBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (nearPageBottom) {
      activeHash = navTargets[navTargets.length - 1][0];
    }

    setActiveNavLink(activeHash);
  };

  const updateScrollState = () => {
    scrollFrame = 0;
    updateHeaderState();
    updateStickyCta();
    updateActiveNav();
  };

  const requestScrollUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollState);
  };

  const scrollToHashTarget = (target, hash, options = {}) => {
    if (!target) return;

    const {
      behavior = prefersReducedMotion.matches ? "auto" : "smooth",
      focusTarget = false,
      replaceHistory = false
    } = options;

    syncHeaderOffset();

    const top = Math.max(0, Math.round(getDocumentTop(target) - headerOffset));

    if (behavior === "auto") {
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      window.scrollTo({ top, behavior: "auto" });
      window.setTimeout(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      }, 0);
    } else {
      window.scrollTo({ top, behavior });
    }

    if (hash) {
      if (replaceHistory && history.replaceState) {
        history.replaceState(null, "", hash);
      } else if (!replaceHistory && history.pushState) {
        if (window.location.hash !== hash) {
          history.pushState(null, "", hash);
        }
      } else if (window.location.hash !== hash) {
        window.location.hash = hash;
      }
    }

    if (focusTarget) {
      const isNaturallyFocusable = target.matches('a[href], button, input, select, [tabindex]:not([tabindex="-1"])');

      if (!isNaturallyFocusable) {
        target.setAttribute("tabindex", "-1");
      }

      const focusDelay = behavior === "smooth" ? 360 : 0;
      window.setTimeout(() => {
        target.focus({ preventScroll: true });

        if (!isNaturallyFocusable) {
          target.addEventListener("blur", () => {
            target.removeAttribute("tabindex");
          }, { once: true });
        }
      }, focusDelay);
    }
  };

  const handleHashNavigation = (hash, options = {}) => {
    const target = getHashTarget(hash);
    if (!target) return false;
    scrollToHashTarget(target, hash, options);
    return true;
  };

  const stabiliseHashNavigation = (hash) => {
    if (!hash) return;

    [0, 120, 320].forEach((delay) => {
      window.setTimeout(() => {
        handleHashNavigation(hash, { behavior: "auto", replaceHistory: true });
        updateScrollState();
      }, delay);
    });
  };

  const setFaqItemState = (item, isOpen) => {
    const button = item.querySelector(".faq-toggle");
    const panel = item.querySelector(".faq-panel");
    if (!button || !panel) return;

    item.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
    panel.style.maxHeight = isOpen ? `${panel.scrollHeight}px` : "0px";
  };

  const syncFaqPanelHeights = () => {
    faqItems.forEach((item) => {
      const panel = item.querySelector(".faq-panel");
      if (!panel) return;
      panel.style.maxHeight = item.classList.contains("is-open") ? `${panel.scrollHeight}px` : "0px";
    });
  };

  if (toggle && mobileMenu) {
    setMenuOpen(false);

    toggle.addEventListener("click", () => {
      const nextState = !isMenuOpen();
      setMenuOpen(nextState, { focusFirstLink: nextState });
      updateStickyCta();
    });

    document.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      if (!isMenuOpen()) return;
      if (header?.contains(event.target)) return;
      setMenuOpen(false);
      updateStickyCta();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !isMenuOpen()) return;
      setMenuOpen(false, { restoreFocus: true });
      updateStickyCta();
    });
  }

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");
    const target = getHashTarget(hash);
    if (!target) return;

    event.preventDefault();

    if (link.closest("[data-mobile-menu]")) {
      setMenuOpen(false);
      updateStickyCta();
    }

    const shouldFocusTarget = event.detail === 0 || link.classList.contains("skip-link");
    scrollToHashTarget(target, hash, { focusTarget: shouldFocusTarget });
  });

  window.addEventListener("hashchange", () => {
    if (!window.location.hash) return;

    stabiliseHashNavigation(window.location.hash);
  });

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", debounce(() => {
    syncHeaderOffset();
    syncFaqPanelHeights();

    if (window.innerWidth >= 980 && isMenuOpen()) {
      setMenuOpen(false);
    }

    updateScrollState();
  }, 120));

  syncHeaderOffset();
  updateScrollState();

  if (window.location.hash) {
    stabiliseHashNavigation(window.location.hash);

    window.addEventListener("load", () => {
      stabiliseHashNavigation(window.location.hash);
    }, { once: true });
  }

  if (faqItems.length) {
    faqItems.forEach((item) => {
      const button = item.querySelector(".faq-toggle");
      if (!button) return;

      setFaqItemState(item, false);

      button.addEventListener("click", () => {
        const shouldOpen = !item.classList.contains("is-open");

        faqItems.forEach((otherItem) => {
          if (otherItem === item) return;
          setFaqItemState(otherItem, false);
        });

        setFaqItemState(item, shouldOpen);
      });
    });

    window.addEventListener("load", syncFaqPanelHeights, { once: true });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const form = document.getElementById("consultation-form");
  const formStatus = document.getElementById("form-status");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector("button[type='submit']");
      const defaultLabel = submitButton?.dataset.defaultLabel || "Submit";

      form.querySelectorAll("input[type='text'], input[type='email'], input[type='tel']").forEach((field) => {
        field.value = field.value.trim();
      });

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      if (formStatus) {
        formStatus.textContent = "Submitting your enquiry...";
        formStatus.classList.remove("is-error");
        formStatus.classList.add("is-loading");
      }

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: {
            Accept: "application/json"
          }
        });

        if (!response.ok) {
          throw new Error(`Form submission failed with status ${response.status}`);
        }

        if (formStatus) {
          formStatus.textContent = "Thank you! Our team will contact you shortly.";
          formStatus.classList.remove("is-error", "is-loading");
        }

        form.reset();
      } catch (error) {
        console.error(error);

        if (formStatus) {
          formStatus.textContent = "Something went wrong. Please try again.";
          formStatus.classList.remove("is-loading");
          formStatus.classList.add("is-error");
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = defaultLabel;
        }
      }
    });
  }

  const scrollTestimonials = (direction) => {
    if (!testimonialTrack) return;
    const amount = Math.max(260, testimonialTrack.clientWidth * 0.82);
    testimonialTrack.scrollBy({ left: direction * amount, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
  };

  if (prevButton && nextButton && testimonialTrack) {
    prevButton.addEventListener("click", () => scrollTestimonials(-1));
    nextButton.addEventListener("click", () => scrollTestimonials(1));
  }
})();
