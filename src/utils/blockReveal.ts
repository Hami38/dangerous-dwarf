/**
 * blockReveal.ts
 * 
 * Inicjalizuje Block Reveal Effect na wszystkich elementach z atrybutem [data-reveal].
 * Wywołaj initBlockReveals() raz — po załadowaniu strony lub po preloaderze.
 * 
 * UŻYCIE W HTML (bezpośrednio):
 *   <h1 data-reveal>Tytuł</h1>
 *   <p data-reveal data-reveal-delay="0.3" data-reveal-color="#BAF52A">Tekst</p>
 * 
 * UŻYCIE PRZEZ KOMPONENT (zalecane):
 *   <Reveal delay={0.3}><h1>Tytuł</h1></Reveal>
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Typy ────────────────────────────────────────────────────────────────────

export interface RevealOptions {
  /** Opóźnienie przed startem animacji (sekundy). Domyślnie: 0 */
  delay?: number;
  /** Kolor bloku zasłaniającego. Domyślnie: #BAF52A */
  color?: string;
  /** Czas trwania jednego przejścia bloku (sekundy). Domyślnie: 0.6 */
  duration?: number;
  /** Kiedy animacja startuje. Domyślnie: 'onScroll' */
  trigger?: 'onLoad' | 'onScroll';
  /** Punkt startowy ScrollTrigger. Domyślnie: 'top 88%' */
  scrollStart?: string;
}

// ─── Stałe domyślne ──────────────────────────────────────────────────────────

const DEFAULTS: Required<RevealOptions> = {
  delay:       0,
  color:       '#BAF52A',
  duration:    0.6,
  trigger:     'onScroll',
  scrollStart: 'top 88%',
};

// ─── Pomocnicze ──────────────────────────────────────────────────────────────

/**
 * Przygotowuje element do animacji:
 * - opakowuje jego zawartość w .reveal-text-inner (ukryty na start)
 * - dodaje .reveal-block (kolorowy prostokąt)
 * Zwraca { block, inner } gotowe do animowania przez GSAP.
 */
const prepareElement = (el: HTMLElement, color: string): { block: HTMLElement; inner: HTMLElement } => {
  // Zabezpieczenie przed podwójną inicjalizacją
  if (el.dataset.revealReady === 'true') {
    return {
      block: el.querySelector('.reveal-block') as HTMLElement,
      inner: el.querySelector('.reveal-text-inner') as HTMLElement,
    };
  }

  // Zachowaj oryginalną zawartość
  const originalHTML = el.innerHTML;

  // Zbuduj strukturę: wrapper z ukrytym tekstem + blok zasłaniający
  el.innerHTML = `
    <span class="reveal-text-inner" style="opacity: 0; display: block;">
      ${originalHTML}
    </span>
    <span class="reveal-block" style="
      position: absolute;
      inset: 0;
      background: ${color};
      transform: scaleX(0);
      transform-origin: left center;
      display: block;
      z-index: 1;
      pointer-events: none;
    "></span>
  `;

  // Element musi być relative żeby blok był pozycjonowany względem niego
  el.style.position = 'relative';
  el.style.overflow = 'hidden';
  el.style.display  = el.style.display || 'block';

  el.dataset.revealReady = 'true';

  return {
    block: el.querySelector('.reveal-block') as HTMLElement,
    inner: el.querySelector('.reveal-text-inner') as HTMLElement,
  };
};

/**
 * Buduje timeline GSAP dla jednego elementu.
 * Faza 1: blok wjeżdża z lewej (scaleX: 0 → 1)
 * Faza 2: tekst pojawia się w tle
 * Faza 3: blok wyjeżdża w prawo (scaleX: 1 → 0, transformOrigin: right)
 */
const buildRevealTimeline = (
  block: HTMLElement,
  inner: HTMLElement,
  options: Required<RevealOptions>
): gsap.core.Timeline => {
  const tl = gsap.timeline({ delay: options.delay });

  tl.to(block, {
    scaleX: 1,
    duration: options.duration,
    ease: 'power2.inOut',
    transformOrigin: 'left center',
  })
  .set(inner, { opacity: 1 })
  .to(block, {
    scaleX: 0,
    duration: options.duration,
    ease: 'power2.inOut',
    transformOrigin: 'right center',
  });

  return tl;
};

// ─── Główna funkcja ──────────────────────────────────────────────────────────

/**
 * Inicjalizuje Block Reveal na wszystkich elementach [data-reveal] w dokumencie.
 * Bezpieczna do wielokrotnego wywołania — pomija już zainicjalizowane elementy.
 * 
 * @example
 * // W Layout.astro po preloaderze:
 * window.addEventListener('preloaderFinished', () => initBlockReveals());
 * 
 * // Lub po załadowaniu strony:
 * document.addEventListener('DOMContentLoaded', () => initBlockReveals());
 */
export const initBlockReveals = (): void => {
  const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');

  if (elements.length === 0) return;

  elements.forEach((el) => {
    // Odczytaj opcje z data-atrybutów (nadpisują DEFAULTS)
    const options: Required<RevealOptions> = {
      delay:       parseFloat(el.dataset.revealDelay    || '') || DEFAULTS.delay,
      color:       el.dataset.revealColor                      || DEFAULTS.color,
      duration:    parseFloat(el.dataset.revealDuration || '') || DEFAULTS.duration,
      trigger:     (el.dataset.revealTrigger as RevealOptions['trigger']) || DEFAULTS.trigger,
      scrollStart: el.dataset.revealStart                      || DEFAULTS.scrollStart,
    };

    const { block, inner } = prepareElement(el, options.color);

    if (options.trigger === 'onLoad') {
      // Odpala się od razu (np. hero heading)
      buildRevealTimeline(block, inner, options);
    } else {
      // Odpala się gdy element wchodzi w viewport
      ScrollTrigger.create({
        trigger: el,
        start: options.scrollStart,
        once: true, // animacja tylko raz
        onEnter: () => buildRevealTimeline(block, inner, options),
      });
    }
  });
};

/**
 * Programowe wywołanie reveal na konkretnym elemencie (bez data-atrybutów).
 * Przydatne gdy tworzysz elementy dynamicznie w JS.
 * 
 * @example
 * import { revealElement } from '@/utils/blockReveal';
 * revealElement(myElement, { delay: 0.2, color: '#fff' });
 */
export const revealElement = (el: HTMLElement, options: RevealOptions = {}): void => {
  const merged: Required<RevealOptions> = { ...DEFAULTS, ...options };
  const { block, inner } = prepareElement(el, merged.color);
  buildRevealTimeline(block, inner, merged);
};