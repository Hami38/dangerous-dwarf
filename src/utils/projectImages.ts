/**
 * Zdjęcia projektów z src/assets/projects — optymalizowane przez Astro (srcset, wymiary).
 * Ścieżki w danych zostają w dotychczasowym formacie: "/images/<projekt>/<plik>".
 */

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/projects/**/*.{webp,jpg,jpeg,png}',
  { eager: true },
);

export const getProjectImage = (path: string): ImageMetadata => {
  const key = path.replace(/^\/images\//, '/src/assets/projects/');
  const image = images[key];
  if (!image) throw new Error(`Brak zdjęcia projektu: ${path} (szukano ${key})`);
  return image.default;
};
