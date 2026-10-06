// Oba słowniki naraz — tylko do użycia po stronie serwera/narzędzi.
// W skryptach przeglądarki korzystaj z ./client (ładuje jeden język na żądanie).
import pl from './pl';
import en from './en';

export type Lang = 'pl' | 'en';

export const translations: Record<Lang, Record<string, string>> = { pl, en };
