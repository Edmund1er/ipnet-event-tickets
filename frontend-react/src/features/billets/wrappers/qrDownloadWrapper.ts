export const qrDownloadWrapper = {
  telechargerQr: (id: string) => {
    const a = document.createElement('a');
    a.href = `/api/billets/${id}/qr`;
    a.download = `billet-${id}.png`;
    a.click();
  }
};
