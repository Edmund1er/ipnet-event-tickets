export const sseFluxWrapper = {
  connecterFlux: (evenementId: number, onMessage: (data: any) => void) => {
    const source = new EventSource(`/api/scan/evenements/${evenementId}/flux`);
    source.onmessage = (e) => onMessage(JSON.parse(e.data));
    return () => source.close();
  }
};
