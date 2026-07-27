document.addEventListener('DOMContentLoaded', () => {
  // Floating stars
  const container = document.createElement('div');
  container.className = 'stars-container';
  document.body.appendChild(container);
    for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star' + (i % 3 === 0 ? ' sm' : '') + (i % 7 === 0 ? ' lg' : '');
    star.style.left = Math.random() * 100 + '%';
    star.style.animationDuration = (10 + Math.random() * 20) + 's';
    star.style.animationDelay = (Math.random() * 20) + 's';
    container.appendChild(star);
  }
  // Set active nav link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('is-active');
    }
  });

  // Reveal on scroll
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));

  // Mobile menu toggle
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // Contact form - WhatsApp redirect
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('formName')?.value || '';
      const email = document.getElementById('formEmail')?.value || '';
      const service = document.getElementById('formService')?.value || '';
      const message = document.getElementById('formMessage')?.value || '';
      const text = `Name: ${name}%0AEmail: ${email}%0AService: ${service}%0AMessage: ${message}`;
      window.open(`https://wa.me/916385314684?text=${text}`, '_blank');
    });
  }
});