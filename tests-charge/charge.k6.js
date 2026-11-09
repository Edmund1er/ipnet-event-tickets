// Test de charge k6 (cahier §6 et §10) : pic d'ouverture des inscriptions et de scans.
//   k6 run -e BASE=http://localhost:8081 -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e EVENEMENT_ID=1 -e JETON_QR=... tests-charge/charge.k6.js
// Seuils issus du cahier : scan < 300 ms au 95e percentile, liste des événements < 500 ms.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE || 'http://localhost:8081'

export const options = {
  scenarios: {
    consultation: { executor: 'ramping-vus', exec: 'listeEvenements', startVUs: 0, stages: [{ duration: '30s', target: 200 }, { duration: '1m', target: 200 }, { duration: '15s', target: 0 }] },
    scans: { executor: 'constant-arrival-rate', exec: 'scan', rate: 30, timeUnit: '1s', duration: '1m', preAllocatedVUs: 50, startTime: '10s' },
  },
  thresholds: {
    'http_req_duration{scenario:consultation}': ['p(95)<500'],
    'http_req_duration{scenario:scans}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
}

export function setup() {
  if (!__ENV.ADMIN_EMAIL) return { jeton: null }
  const r = http.post(`${BASE}/api/auth/connexion`, JSON.stringify({ email: __ENV.ADMIN_EMAIL, motDePasse: __ENV.ADMIN_PASSWORD }), {
    headers: { 'Content-Type': 'application/json' },
  })
  return { jeton: r.json('accessToken') }
}

export function listeEvenements() {
  const r = http.get(`${BASE}/api/evenements?page=0&size=12`)
  check(r, { 'liste 200': (x) => x.status === 200 })
  sleep(1)
}

export function scan(data) {
  if (!data.jeton || !__ENV.JETON_QR) return
  // Un même billet scanné en boucle : une acceptation puis des refus « déjà utilisé » (RG-11)
  const r = http.post(`${BASE}/api/scan`, JSON.stringify({ jeton: __ENV.JETON_QR, evenementId: Number(__ENV.EVENEMENT_ID || 1) }), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.jeton}` },
  })
  check(r, { 'scan répond': (x) => x.status === 200 || x.status === 429 })
}
