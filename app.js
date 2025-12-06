// LOADER, NAVBAR, REVEAL, PARALLAX, MENU, SCROLL
document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  // 1) LOADING SCREEN
  setTimeout(() => {
    loader.classList.add("hide");
  }, 900); // istersen süreyi uzatabilirsin

  // 2) HAMBURGER MENÜ
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });

  // Linke tıklayınca menüyü kapat (mobil)
  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });

  // 3) NAVBAR SCROLL SHADOW
  const onScrollNavbar = () => {
    if (window.scrollY > 10) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", onScrollNavbar);
  onScrollNavbar();

  // 4) REVEAL ANIMATIONS
  const revealElements = document.querySelectorAll(".reveal");

  const handleReveal = () => {
    const trigger = window.innerHeight * 0.85;
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < trigger) {
        el.classList.add("visible");
      }
    });
  };
  window.addEventListener("scroll", handleReveal);
  handleReveal();

  // 5) PARALLAX
  const parallaxElements = document.querySelectorAll("[data-parallax-speed]");
  const handleParallax = () => {
    const scrollY = window.scrollY;
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute("data-parallax-speed")) || 0;
      const move = scrollY * speed;
      el.style.transform = `translateY(${move}px)`;
    });
  };
  window.addEventListener("scroll", handleParallax);
  handleParallax();

  // 6) NAV LİNKLERİNE SMOOTH SCROLL
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const targetId = link.getAttribute("href").slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth"
        });
      }
    });
  });
});
