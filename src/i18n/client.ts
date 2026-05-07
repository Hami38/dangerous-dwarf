import { translations, type Lang } from './translations';

export type { Lang };

export function getLang(): Lang {
  return (localStorage.getItem('lang') as Lang) || 'pl';
}

export function applyTranslations(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.setAttribute('data-lang', lang);

  const t = translations[lang];

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    if (key in t) el.textContent = t[key];
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html')!;
    if (key in t) el.innerHTML = t[key];
  });

  document.querySelectorAll<HTMLElement>('[data-lang-btn]').forEach((btn) => {
    const isActive = btn.getAttribute('data-lang-btn') === lang;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
}

export function setLang(lang: Lang): void {
  localStorage.setItem('lang', lang);
  applyTranslations(lang);
}

export function initI18n(): void {
  applyTranslations(getLang());
}
