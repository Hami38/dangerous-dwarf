/**
 * lightbox.ts
 *
 * Podgląd zdjęć w case study. Każdy obrazek .cs-img staje się przyciskiem
 * (klik, Enter, Spacja), a otwarty podgląd trzyma fokus w sobie i po zamknięciu
 * oddaje go na miniaturę, z której został otwarty.
 *
 * Wymaga w HTML: #cs-lightbox (z atrybutem inert) z .cs-lb-backdrop, .cs-lb-close i #cs-lb-img.
 */

import { getLang } from '../i18n/client';

const zoomHintSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>`;

const LABELS = {
  pl: { zoom: 'Powiększ zdjęcie', dialog: 'Podgląd obrazu', close: 'Zamknij podgląd' },
  en: { zoom: 'Enlarge image',    dialog: 'Image preview',  close: 'Close preview' },
};

export const initLightbox = (): void => {
  const lightbox = document.getElementById('cs-lightbox');
  const lbImg    = document.getElementById('cs-lb-img') as HTMLImageElement | null;
  if (!lightbox || !lbImg) return;

  const lbClose    = lightbox.querySelector<HTMLElement>('.cs-lb-close')!;
  const lbBackdrop = lightbox.querySelector<HTMLElement>('.cs-lb-backdrop')!;
  const t = () => LABELS[getLang()] ?? LABELS.pl;

  let opener: HTMLElement | null = null;

  const isOpen = () => lightbox.classList.contains('cs-lb-open');

  function openLightbox(src: string, alt: string, from: HTMLElement) {
    opener = from;
    lbImg!.src = src;
    lbImg!.alt = alt;
    lightbox!.setAttribute('aria-label', t().dialog);
    lbClose.setAttribute('aria-label', t().close);
    lightbox!.inert = false;
    lightbox!.classList.add('cs-lb-open');
    document.body.style.overflow = 'hidden';
    lbClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    lightbox!.classList.remove('cs-lb-open');
    lightbox!.inert = true;
    document.body.style.removeProperty('overflow');
    opener?.focus({ preventScroll: true });
    opener = null;
    setTimeout(() => { lbImg!.src = ''; }, 380);
  }

  // Miniatury → przyciski otwierające podgląd
  document.querySelectorAll<HTMLImageElement>('.cs-img').forEach((img) => {
    const wrap = img.parentElement as HTMLElement;
    wrap.classList.add('cs-img-wrap');
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-haspopup', 'dialog');
    wrap.setAttribute('aria-label', img.alt ? `${t().zoom}: ${img.alt}` : t().zoom);

    const hint = document.createElement('div');
    hint.className = 'cs-img-hint';
    hint.innerHTML = zoomHintSVG;
    hint.setAttribute('aria-hidden', 'true');
    wrap.appendChild(hint);

    // data-full = oryginał w pełnej rozdzielczości (ProjectImage); miniatura ma srcset
    const open = () => openLightbox(img.dataset.full || img.src, img.alt, wrap);
    wrap.addEventListener('click', open);
    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'Tab') {
      // Jedyny interaktywny element w podglądzie to przycisk zamknięcia
      e.preventDefault();
      lbClose.focus();
    }
  });
};
