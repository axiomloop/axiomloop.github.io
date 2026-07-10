/* ============================================================
   axiomloop — contact / pilot modal forms
   Opens native <dialog>s, submits to Formspree via fetch so the
   user never leaves the page. Handles success, error, spam
   honeypot, and the not-yet-configured placeholder endpoint.
   ============================================================ */
(function () {
  "use strict";

  const dialogs = {
    talk: document.getElementById("modal-talk"),
    pilot: document.getElementById("modal-pilot"),
  };

  let lastFocused = null;

  // ---- Open ---------------------------------------------------------------
  document.querySelectorAll("[data-modal]").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      const dlg = dialogs[trigger.dataset.modal];
      if (!dlg) return;                       // no dialog -> anchor fallback
      e.preventDefault();
      lastFocused = document.activeElement;
      resetForm(dlg.querySelector("form"));
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", "");      // very old browsers
      const first = dlg.querySelector("input, textarea, select");
      if (first) setTimeout(() => first.focus(), 60);
    });
  });

  // ---- Close (button, backdrop click, Escape handled natively) -----------
  Object.values(dialogs).forEach((dlg) => {
    if (!dlg) return;
    dlg.querySelectorAll("[data-close]").forEach((btn) =>
      btn.addEventListener("click", () => dlg.close())
    );
    // click on backdrop (outside the form) closes
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener("close", () => {
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
    });
  });

  // ---- Submit via fetch ---------------------------------------------------
  Object.values(dialogs).forEach((dlg) => {
    if (!dlg) return;
    const form = dlg.querySelector("form");
    const status = form.querySelector(".modal__status");
    const submit = form.querySelector(".modal__submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // honeypot: silently succeed for bots
      if (form.querySelector('input[name="_gotcha"]').value) { showSent(form); return; }

      if (!form.checkValidity()) { form.reportValidity(); return; }

      // Guard: placeholder endpoint not swapped yet
      if (form.action.includes("YOUR_")) {
        setStatus(status, "err",
          "Form endpoint not configured yet. Add your Formspree ID to go live.");
        return;
      }

      const original = submit.textContent;
      submit.disabled = true;
      submit.textContent = "Sending…";
      setStatus(status, "", "");

      try {
        const res = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          showSent(form);
        } else {
          const data = await res.json().catch(() => ({}));
          const msg = data.errors ? data.errors.map((x) => x.message).join(", ")
                                  : "Something went wrong. Please try again or email us directly.";
          setStatus(status, "err", msg);
        }
      } catch (_) {
        setStatus(status, "err", "Network error. Please try again or email hello@axiomloop.com.");
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  });

  // ---- Helpers ------------------------------------------------------------
  function setStatus(el, cls, msg) {
    el.className = "modal__status" + (cls ? " " + cls : "");
    el.textContent = msg;
  }

  function showSent(form) {
    form.classList.add("sent");
    const status = form.querySelector(".modal__status");
    const kind = form.querySelector('input[name="form_type"]').value === "pilot"
      ? "Pilot request received — we'll be in touch shortly. "
      : "Message sent — thanks! We'll reply soon. ";
    setStatus(status, "ok", kind);
  }

  function resetForm(form) {
    if (!form) return;
    form.classList.remove("sent");
    form.reset();
    setStatus(form.querySelector(".modal__status"), "", "");
  }
})();
