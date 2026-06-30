// ===========================================================
// INNOVEX INFRATECH — shared site behaviour
// ===========================================================

// ---- Mobile nav ----
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.burger');
  const nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      nav.classList.toggle('open');
      burger.classList.toggle('open');
    });
  }
  // accordion dropdowns on touch/mobile
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.dropdown');
    if (!dropdown) return;
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 720) {
        e.preventDefault();
        item.classList.toggle('open');
      }
    });
  });

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---- Stat counters ----
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    let started = false;
    const run = () => {
      if (started) return;
      started = true;
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const iv = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(iv); }
        el.textContent = cur + suffix;
      }, 28);
    };
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { run(); io2.disconnect(); } });
      }, { threshold: 0.4 });
      io2.observe(el);
    } else { run(); }
  });

  initMesh();
  initContactForm();
});

// ---- Network mesh hero animation: traveling signal pulses along links ----
function initMesh() {
  const svg = document.querySelector('.mesh-svg');
  if (!svg) return;
  const pulses = svg.querySelectorAll('.pulse');
  const paths = svg.querySelectorAll('.link');
  if (!pulses.length || !paths.length) return;

  const animations = Array.from(pulses).map((pulse, i) => {
    const path = paths[i % paths.length];
    return { pulse, path, t: Math.random(), speed: 0.0024 + Math.random() * 0.003 };
  });

  function frame() {
    animations.forEach(a => {
      a.t += a.speed;
      if (a.t > 1) a.t = 0;
      const len = a.path.getTotalLength();
      const pt = a.path.getPointAtLength(len * a.t);
      a.pulse.setAttribute('cx', pt.x);
      a.pulse.setAttribute('cy', pt.y);
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---- Contact / quote form -> Cloudflare Worker -> Resend ----
// Replace WORKER_URL with your deployed Cloudflare Worker endpoint.
const WORKER_URL = 'https://innovex-contact-form.YOUR-SUBDOMAIN.workers.dev';

function initContactForm() {
  const forms = document.querySelectorAll('[data-contact-form]');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const msg = form.querySelector('.form-msg');
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Sending…';
      msg.className = 'form-msg';

      const payload = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Request failed');
        msg.textContent = "Thanks — we've received your request. Our team will reach out within one business day.";
        msg.classList.add('ok');
        form.reset();
      } catch (err) {
        msg.textContent = 'Something went wrong sending your message. Please call or WhatsApp us directly.';
        msg.classList.add('err');
      } finally {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    });
  });
}
