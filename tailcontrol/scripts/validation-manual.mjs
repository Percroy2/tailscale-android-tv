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
  },
  {
    id: 'M2',
    area: 'OAuth Tailscale',
    task: 'Enregistrer OAuth client réel → dashboard affiche machines du tailnet',
  },
  {
    id: 'M3',
    area: 'RBAC',
    task: 'Jumeler une TV profil LECTURE → menu sans DNS/clés/politique',
  },
  {
    id: 'M4',
    area: 'Multi-tailnet',
    task: 'Switch tailnet dans Paramètres TV → données dashboard changent',
  },
  {
    id: 'M5',
    area: 'Révocation',
    task: 'Révoquer TV depuis portail → déconnexion immédiate (WebSocket)',
  },
  {
    id: 'M6',
    area: 'Offline',
    task: 'Couper réseau TV → cache Room affiche dernières machines/dashboard',
  },
  {
    id: 'M7',
    area: 'Supervision',
    task: 'Ping/WoL depuis TV + agent LAN remonte dans Monitoring',
  },
  {
    id: 'M8',
    area: 'PIN admin',
    task: 'Actions sensibles (clés, users) bloquées sans PIN configuré',
  },
];

console.log('TailControl TV v1.0 — validation manuelle\n');
console.log('Critères §86 structurels : npm run verify\n');
console.log('Checklist matérielle / tailnet réel :\n');

for (const check of checks) {
  console.log(`[ ] ${check.id} ${check.area}`);
  console.log(`    ${check.task}\n`);
}

console.log(`${checks.length} points à cocher avant clôture production.`);
