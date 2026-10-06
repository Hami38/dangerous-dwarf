// Przełączanie języka po stronie przeglądarki.
// HTML jest renderowany po polsku, więc słownik PL nie jest potrzebny przy wejściu na stronę.
// Każdy słownik to osobny plik ładowany dopiero wtedy, gdy jest potrzebny.
export type Lang = 'pl' | 'en';
type Dict = Record<string, string>;

const loaders: Record<Lang, () => Promise<{ default: Dict }>> = {
  pl: () => import('./pl'),
  en: () => import('./en'),
};
const cache: Partial<Record<Lang, Dict>> = {};
// Język, w którym jest obecnie treść strony (HTML startuje po polsku)
let shown: Lang = 'pl';

export function getLang(): Lang {
  try {
    return (localStorage.getItem('lang') as Lang) || 'pl';
  } catch {
    return 'pl';
  }
}

/** Słownik danego języka (pobiera go przy pierwszym użyciu). */
export async function loadDict(lang: Lang): Promise<Dict> {
  if (!cache[lang]) cache[lang] = (await loaders[lang]()).default;
  return cache[lang]!;
}

/** Tekst w bieżącym języku; fallback, gdy klucza brak. */
export async function tr(key: string, fallback = ''): Promise<string> {
  const t = await loadDict(getLang());
  return t[key] ?? fallback;
}

function setActiveButtons(lang: Lang) {
  document.querySelectorAll<HTMLElement>('[data-lang-btn]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang-btn') === lang;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

export async function applyTranslations(lang: Lang): Promise<void> {
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);
  setActiveButtons(lang);

  // Strona już jest w tym języku po polsku z serwera — nic do podmiany
  if (lang === 'pl' && shown === 'pl') return;

  const t = await loadDict(lang);
  // Użytkownik mógł w międzyczasie przełączyć język ponownie
  if (getLang() !== lang) return;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    if (key in t) el.textContent = t[key];
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html')!;
    if (key in t) el.innerHTML = t[key];
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria')!;
    if (key in t) el.setAttribute('aria-label', t[key]);
  });

  document.querySelectorAll<HTMLImageElement>('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt')!;
    if (key in t) el.alt = t[key];
  });

  document.querySelectorAll<HTMLAnchorElement>('[data-i18n-href]').forEach((el) => {
    const key = el.getAttribute('data-i18n-href')!;
    if (key in t) el.href = t[key];
  });

  shown = lang;
}

export function setLang(lang: Lang): void {
  try {
    localStorage.setItem('lang', lang);
  } catch {
    /* tryb prywatny — język tylko na tę stronę */
  }
  void applyTranslations(lang);
}

export function initI18n(): void {
  void applyTranslations(getLang());
}
