const revealTargets = document.querySelectorAll(
  ".hero-copy, .project-card, .info-card, .notes-columns > div"
);

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12
    }
  );

  revealTargets.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}
