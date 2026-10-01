/**
 * frameSequence.ts
 *
 * Sekwencja klatek rysowana na <canvas> (sekcja „expand” na stronie głównej).
 * Klatki pobierają się dopiero, gdy sekcja zbliża się do ekranu — nie przy wejściu na stronę.
 * Dopóki klatka się nie wczyta, rysowana jest najbliższa wcześniejsza gotowa
 * (klatka 1 to statyczny <img>, który jest już na stronie).
 */

interface Options {
  canvas: HTMLCanvasElement;
  /** Widoczny już <img> z pierwszą klatką */
  firstFrame: HTMLImageElement;
  /** Element, którego zbliżenie do ekranu startuje pobieranie */
  trigger: Element;
  frameCount: number;
  framePath: (index: number) => string;
  /** Jak wcześnie zacząć pobieranie (rootMargin IntersectionObserver) */
  preloadMargin?: string;
}

export const createFrameSequence = ({
  canvas,
  firstFrame,
  trigger,
  frameCount,
  framePath,
  preloadMargin = '200% 0px',
}: Options) => {
  const ctx = canvas.getContext('2d');
  const seq = { frame: 1 };
  const images: (HTMLImageElement | undefined)[] = [firstFrame];
  let cW = 0, cH = 0;

  const isReady = (img?: HTMLImageElement) => !!img && img.complete && img.naturalWidth > 0;

  const cacheSize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    cW = Math.round(rect.width * dpr);
    cH = Math.round(rect.height * dpr);
    canvas.width = cW;
    canvas.height = cH;
  };

  const render = () => {
    if (!ctx || cW === 0) return;
    // Najbliższa gotowa klatka nie późniejsza niż żądana
    let i = seq.frame - 1;
    while (i > 0 && !isReady(images[i])) i--;
    const img = images[i];
    if (!isReady(img)) return;

    const ir = img!.naturalWidth / img!.naturalHeight;
    const cr = cW / cH;
    let dW, dH, dX, dY;
    if (ir > cr) { dH = cH; dW = cH * ir; dX = (cW - dW) / 2; dY = 0; }
    else         { dW = cW; dH = cW / ir; dX = 0; dY = (cH - dH) / 2; }
    ctx.clearRect(0, 0, cW, cH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img!, dX, dY, dW, dH);
  };

  const load = () => {
    for (let i = 2; i <= frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      // Dorysuj, jeśli ta klatka jest akurat potrzebna (albo bliżej niż obecnie rysowana)
      img.onload = () => { if (i <= seq.frame) render(); };
      img.src = framePath(i);
      images[i - 1] = img;
    }
  };

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      load();
    }
  }, { rootMargin: preloadMargin });
  observer.observe(trigger);

  return {
    seq,
    render,
    cacheSize,
    destroy: () => observer.disconnect(),
  };
};
