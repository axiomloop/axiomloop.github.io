/* ============================================================
   axiomloop — UI interactions
   Nav scroll state, mobile menu, scroll-reveal, stat count-up.
   Vanilla JS, no dependencies.
   ============================================================ */
(function () {
  "use strict";

  // ---- Year in footer -----------------------------------------------------
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- Nav scroll state ---------------------------------------------------
  const nav = document.getElementById("nav");
  const onScroll = () => nav && nav.classList.toggle("scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---- Mobile menu --------------------------------------------------------
  const toggle = document.getElementById("navToggle");
  const mobile = document.getElementById("navMobile");
  if (toggle && mobile) {
    const close = () => { mobile.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    toggle.addEventListener("click", () => {
      const open = mobile.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    mobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  // ---- Scroll reveal ------------------------------------------------------
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // subtle stagger within a shared parent
          const sibs = Array.from(el.parentElement ? el.parentElement.children : []).filter((c) => c.hasAttribute("data-reveal"));
          const idx = sibs.indexOf(el);
          el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 70 : 0) + "ms";
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  // ---- Stat count-up ------------------------------------------------------
  const stats = document.querySelectorAll(".stat__num[data-count]");
  const fmt = (n, decimals) => {
    if (decimals) return n.toFixed(decimals);
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(0) + "K";
    return Math.round(n).toString();
  };
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    if (isNaN(target)) return;
    const dur = 1500;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target, decimals) + suffix;
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window && stats.length) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); so.unobserve(e.target); } });
    }, { threshold: 0.5 });
    stats.forEach((s) => so.observe(s));
  }
})();
