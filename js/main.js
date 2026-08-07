/* Multi Scaff Engineering - shared front-end behaviour */
(function () {
  "use strict";

  /* ---------- Header scroll + mobile nav ---------- */
  const header = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");

  function onScroll() {
    if (!header) return;
    // Only the homepage hero is transparent-until-scrolled; every other
    // page ships a solid header from the start, so keep it "scrolled".
    if (!document.body.classList.contains("home-hero")) {
      header.classList.add("scrolled");
      return;
    }
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll);
  onScroll();

  if (navToggle && mainNav) {
    const navBackdrop = document.createElement("div");
    navBackdrop.className = "nav-backdrop";
    document.body.appendChild(navBackdrop);
    const navClose = mainNav.querySelector(".nav-close");

    function closeNav() {
      mainNav.classList.remove("open");
      navBackdrop.classList.remove("open");
    }
    function toggleNav() {
      const willOpen = !mainNav.classList.contains("open");
      mainNav.classList.toggle("open", willOpen);
      navBackdrop.classList.toggle("open", willOpen);
    }

    navToggle.addEventListener("click", toggleNav);
    navBackdrop.addEventListener("click", closeNav);
    if (navClose) navClose.addEventListener("click", closeNav);
    mainNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", closeNav)
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- Project grid rendering (must run BEFORE the reveal
     observer below, so dynamically created cards get observed too) ---------- */
  const PROJECTS = window.PROJECTS || [];

  function projectCard(p) {
    const cover = "/assets/portfolio/" + p.slug + "/1_thumb.jpg";
    const div = document.createElement("div");
    div.className = "project-card reveal";
    div.setAttribute("data-slug", p.slug);
    div.innerHTML =
      '<img src="' + cover + '" alt="' + p.title + '">' +
      '<span class="count-badge">' + icoCamera() + " " + p.count + "</span>" +
      '<div class="overlay">' +
      '<span class="cat">Scaffolding</span>' +
      "<h3>" + p.title + "</h3>" +
      '<span class="loc">' + p.location + "</span>" +
      "</div>";
    div.addEventListener("click", () => {
      if (p.bigGallery) openGalleryGrid(p.slug);
      else openLightbox(p.slug, 0);
    });
    return div;
  }

  function icoCamera() {
    return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';
  }

  function renderGrid(containerSelector, list) {
    const el = document.querySelector(containerSelector);
    if (!el) return;
    list.forEach((p) => el.appendChild(projectCard(p)));
  }

  // Home page: always show the 8 most recently added projects, so new
  // galleries automatically appear here without needing a manual flag.
  const newest8 = PROJECTS.slice()
    .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
    .slice(0, 8);
  renderGrid("#featured-projects", newest8);

  // Portfolio page: all projects
  const fullGrid = document.querySelector("#all-projects");
  if (fullGrid) {
    renderGrid("#all-projects", PROJECTS);
  }

  /* ---------- Reveal on scroll ----------
     Runs AFTER project cards are rendered above, so every .reveal
     element on the page -- static or dynamically created -- gets observed. */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
    // Safety net: if a browser quirk ever stops the observer from firing,
    // don't leave content permanently invisible -- force it visible after 2.5s.
    setTimeout(() => {
      document.querySelectorAll(".reveal:not(.in)").forEach((el) => el.classList.add("in"));
    }, 2500);
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated stat counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.getAttribute("data-count"), 10) || 0;
      const suffix = el.getAttribute("data-suffix") || "";
      const dur = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if ("IntersectionObserver" in window) {
      const io2 = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animate(e.target);
              io2.unobserve(e.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((c) => io2.observe(c));
    } else {
      counters.forEach(animate);
    }
  }

  /* ---------- Lightbox ---------- */
  const lb = document.querySelector(".lightbox");
  let currentSlug = null;
  let currentIndex = 0;
  let currentCount = 0;

  function findProject(slug) {
    return PROJECTS.find((p) => p.slug === slug);
  }

  window.openLightbox = function (slug, index) {
    const p = findProject(slug);
    if (!p || !lb) return;
    currentSlug = slug;
    currentIndex = index;
    currentCount = p.count;
    updateLightbox();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  function updateLightbox() {
    const p = findProject(currentSlug);
    if (!p) return;
    const img = lb.querySelector("img");
    const cap = lb.querySelector(".lb-title");
    const count = lb.querySelector(".lb-count");
    img.src = "/assets/portfolio/" + currentSlug + "/" + (currentIndex + 1) + ".jpg";
    img.alt = p.title;
    cap.textContent = p.title + ", " + p.location;
    count.textContent = (currentIndex + 1) + " / " + currentCount;
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  function nextImg() {
    if (currentCount < 2) return;
    currentIndex = (currentIndex + 1) % currentCount;
    updateLightbox();
  }
  function prevImg() {
    if (currentCount < 2) return;
    currentIndex = (currentIndex - 1 + currentCount) % currentCount;
    updateLightbox();
  }

  if (lb) {
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-next").addEventListener("click", nextImg);
    lb.querySelector(".lb-prev").addEventListener("click", prevImg);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImg();
      if (e.key === "ArrowLeft") prevImg();
    });
  }

  /* ---------- Gallery grid modal (for large photo sets) ----------
     Click a project card flagged bigGallery:true, browse all thumbnails
     at once, then click any thumbnail to open it full-screen with the
     usual prev/next lightbox. */
  const gm = document.querySelector(".gallery-modal");

  window.openGalleryGrid = function (slug) {
    const p = findProject(slug);
    if (!p || !gm) return;
    gm.querySelector(".gm-title").textContent = p.title;
    gm.querySelector(".gm-loc").textContent = p.location;
    gm.querySelector(".gm-count").textContent = p.count + " photos";
    const grid = gm.querySelector(".gallery-modal-grid");
    grid.innerHTML = "";
    for (let i = 0; i < p.count; i++) {
      const thumb = document.createElement("div");
      thumb.className = "gm-thumb";
      thumb.innerHTML =
        '<span class="gm-num">' + (i + 1) + "</span>" +
        '<img src="assets/portfolio/' + slug + '/' + (i + 1) + '_thumb.jpg" alt="' + p.title + " " + (i + 1) + '" loading="lazy">';
      thumb.addEventListener("click", () => {
        closeGalleryGrid();
        openLightbox(slug, i);
      });
      grid.appendChild(thumb);
    }
    gm.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  function closeGalleryGrid() {
    if (!gm) return;
    gm.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (gm) {
    gm.querySelector(".gm-close").addEventListener("click", closeGalleryGrid);
    gm.addEventListener("click", (e) => {
      if (e.target === gm) closeGalleryGrid();
    });
    document.addEventListener("keydown", (e) => {
      if (!gm.classList.contains("open")) return;
      if (e.key === "Escape") closeGalleryGrid();
    });
  }

  /* ---------- Filter bar (portfolio page) ---------- */
  const filterBar = document.querySelector(".filter-bar");
  if (filterBar) {
    filterBar.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBar.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const val = btn.getAttribute("data-filter");
        document.querySelectorAll("#all-projects .project-card").forEach((card) => {
          const slug = card.getAttribute("data-slug");
          const p = findProject(slug);
          const show = val === "all" || (val === "featured" && p.featured);
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const success = document.querySelector(".form-success");
      form.reset();
      if (success) success.classList.add("show");
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
