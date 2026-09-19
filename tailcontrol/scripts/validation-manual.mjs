#!/usr/bin/env node
/**
 * Checklist validation manuelle TailControl TV v1.0
 * (complète les 34 critères §86 automatisés)
 */
const checks = [
  {
    id: 'M1',
    area: 'Fire TV / Shield',
    task: 'Installer app-debug.apk via ADB, jumelage QR/code depuis le portail',
    automated: 'APK build CI + smoke jumelage API',
  },
  {
    id: 'M2',
    area: 'OAuth Tailscale',
    task: 'Enregistrer OAuth client réel → dashboard affiche machines du tailnet',
    automated: 'E2E credentials chiffrés + dashboard OAuth mock',
  },
  {
    id: 'M3',
    area: 'RBAC',
    task: 'Jumeler une TV profil LECTURE → menu sans DNS/clés/politique',
    automated: 'E2E READ_ONLY /tv/profile + NavPermissions.kt',
  },
  {
    id: 'M4',
    area: 'Multi-tailnet',
    task: 'Switch tailnet dans Paramètres TV → données dashboard changent',
    automated: 'API switch tailnet + écran Settings TV (structure)',
  },
  {
    id: 'M5',
    area: 'Révocation',
    task: 'Révoquer TV depuis portail → déconnexion immédiate (WebSocket)',
    automated: 'E2E HTTP 401 + WebSocket session_revoked',
  },
  {
    id: 'M6',
    area: 'Offline',
    task: 'Couper réseau TV → cache Room affiche dernières machines/dashboard',
    automated: 'Caching*Repository + Room (structure §86)',
  },
  {
    id: 'M7',
    area: 'Supervision',
    task: 'Ping/WoL depuis TV + agent LAN remonte dans Monitoring',
    automated: 'E2E monitor port + agents register/list/check',
  },
  {
    id: 'M8',
    area: 'PIN admin',
    task: 'Actions sensibles (clés, users) bloquées sans PIN configuré',
    automated: 'AdminPinStore + AdminPinGate (structure §86)',
  },
];

console.log('TailControl TV v1.0 — validation manuelle\n');
console.log('Critères §86 structurels : npm run verify\n');
console.log('Couverture auto vs matériel :\n');

for (const check of checks) {
  console.log(`[ ] ${check.id} ${check.area}`);
  console.log(`    Manuel : ${check.task}`);
  console.log(`    Auto   : ${check.automated}\n`);
}

console.log(`${checks.length} points à valider sur appareil / tailnet réel.`);
console.log('Dépôt : https://github.com/Percroy2/tailscale-android-tv');
