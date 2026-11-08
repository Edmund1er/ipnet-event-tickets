export const evenementImageWrapper = {
  getUrlImage: (chemin?: string) => chemin ? `/api/images/${chemin}` : '/assets/hero.png'
};
