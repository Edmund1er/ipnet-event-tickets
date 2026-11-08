export const uploadWrapper = {
  creerFormDataPreuve: (reference: string, fichier?: File): FormData => {
    const fd = new FormData();
    fd.append('reference', reference);
    if (fichier) fd.append('fichier', fichier);
    return fd;
  }
};
