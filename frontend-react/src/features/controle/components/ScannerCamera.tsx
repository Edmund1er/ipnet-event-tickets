import React, { useEffect, useRef } from 'react';
import { html5QrcodeWrapper } from '../wrappers/html5QrcodeWrapper';

export const ScannerCamera: React.FC<{ onScanSuccess: (code: string) => void }> = ({ onScanSuccess }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scannerId = 'reader-qr-view';
    const scanner = html5QrcodeWrapper.initialiser(scannerId, onScanSuccess);
    return () => {
      scanner.arreter();
    };
  }, [onScanSuccess]);

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
      <div id="reader-qr-view" ref={elementRef} className="w-full max-w-sm mx-auto rounded-lg overflow-hidden" />
      <p className="text-xs text-slate-400 mt-2">Positionnez le QR code de l'entrée face à la caméra</p>
    </div>
  );
};
