export const releveUploadWrapper = {
  construireReleveFormData: (fichierCsv: File): FormData => {
    const fd = new FormData();
    fd.append('fichierCsv', fichierCsv);
    return fd;
  }
};
