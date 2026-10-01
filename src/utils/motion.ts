/**
 * Czy użytkownik ma w systemie włączone ograniczenie ruchu (prefers-reduced-motion).
 * Klasę .reduce-motion ustawia skrypt inline w <head> (Layout.astro) przed pierwszym renderem.
 */
export const prefersReducedMotion = (): boolean =>
  document.documentElement.classList.contains('reduce-motion');
