# TailControl TV

Console d'administration Tailscale pour **Android TV** et **Fire TV**, avec backend NestJS et portail Web compagnon.

**Nom de travail :** TailControl TV  
**Auteur :** Percroy  
**Version cible :** 1.0.0

## Architecture

```text
tailcontrol/
├── android-tv/      # Kotlin, Jetpack Compose for TV, MVVM, Room, Keystore
├── backend/         # NestJS, Prisma, PostgreSQL, Redis, WebSocket
├── web/             # React, TypeScript, TailwindCSS
└── infrastructure/  # Docker, agent supervision, PostgreSQL, Redis
```

## Démarrage rapide

Scripts racine du monorepo :

```bash
cd tailcontrol
npm run docker:up      # Postgres, Redis, API, portail
npm run test:all       # §86 + E2E
npm run smoke          # Parcours jumelage bout-en-bout
npm run build:web
```

### Infrastructure

```bash
cd tailcontrol/infrastructure/docker
docker compose up -d postgres redis
```

Stack complète (API + Web) :

```bash
docker compose up -d
```

API : `http://localhost:3000/api/v1/health`  
Portail Docker (nginx) : `http://localhost:8080`  
Portail dev (Vite) : `http://localhost:5173`

> **Note Windows** : PostgreSQL et Redis sont exposés sur les ports **5433** et **6380** pour éviter les conflits avec des services locaux.

### Backend

```bash
cd tailcontrol/backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run start:dev
```

> **Lockfile npm** : le `package-lock.json` est généré pour **npm 10** (CI GitHub Actions et images Docker). En local, si `npm ci` échoue avec npm 11+, régénérez avec `npx npm@10 install`.

API : `http://localhost:3000`  
Santé : `GET /api/v1/health`  
Jumelage : `POST /api/v1/pairing`

### Portail Web

```bash
cd tailcontrol/web
npm install
npm run dev
```

UI : `http://localhost:5173`

### Application TV

```bash
cd tailcontrol/android-tv
cp local.properties.example local.properties
# Éditez sdk.dir et tailcontrol.api.baseUrl (IP LAN pour Fire TV / Shield)
./gradlew assembleDebug   # Windows : gradlew.bat assembleDebug
```

Ou ouvrir le dossier dans Android Studio, synchroniser Gradle, lancer sur un émulateur Android TV ou Fire TV.

Fonctionnalités clés : jumelage QR/code, refresh token automatique sur 401, cache Room offline, PIN admin, révocation WebSocket immédiate, switch multi-tailnet.

#### Fire TV / Shield (sideload)

```bash
cd tailcontrol
npm run build:android
# APK : android-tv/app/build/outputs/apk/debug/app-debug.apk

adb connect <IP_FIRE_TV>:5555
adb install -r android-tv/app/build/outputs/apk/debug/app-debug.apk
```

Dans `local.properties`, `tailcontrol.api.baseUrl` doit pointer vers l'IP LAN du serveur TailControl (ex. `http://192.168.1.10:3000`), pas `localhost`.

#### OAuth Tailscale (tailnet réel)

1. Créer un OAuth client sur [Tailscale Admin → OAuth clients](https://login.tailscale.com/admin/settings/oauth)
2. Démarrer la stack (`npm run docker:up`) et ouvrir le portail `http://localhost:8080`
3. Créer un compte, un tailnet, puis **Paramètres → Credentials Tailscale**
4. Vérifier le dashboard (machines, routes, DNS…) — le secret reste chiffré côté API

### Agent de supervision

```bash
node tailcontrol/infrastructure/agent/tailcontrol-agent.mjs \
  --api http://localhost:3000 \
  --tailnet <tailnetId> \
  --token <jwt-portail> \
  --name "Agent LAN"
```

## Sécurité

- Aucun secret Tailscale dans l'APK TV
- OAuth Tailscale chiffré AES-256-GCM côté serveur
- Tokens TV dans EncryptedSharedPreferences (Android Keystore)
- PIN administrateur local pour actions sensibles

## Validation §86

34 critères structurels vérifiés automatiquement :

```bash
cd tailcontrol
npm run verify          # artefacts + test:all (§86 + E2E)
# ou uniquement les tests backend :
cd backend && npm test
```

Le fichier `test/validation.s86.spec.ts` contrôle la présence de tous les modules V1 (jumelage QR, RBAC, dashboard, machines, routes, DNS, alertes, supervision, cache offline, révocation WebSocket, etc.).

Tests E2E API :

```bash
npm run test:e2e
```

Smoke test stack (API directe ou portail Docker) :

```bash
node tailcontrol/infrastructure/scripts/smoke-stack.mjs
API_BASE=http://localhost:8080 node tailcontrol/infrastructure/scripts/smoke-stack.mjs
```

## Statut V1

| Composant | État |
|-----------|------|
| Backend API | Modules complets, alertes auto, agents, favoris |
| Portail Web | Dashboard, TVs, alertes, DNS, clés, politique, supervision |
| Android TV | Navigation complète, APK debug buildable, Room cache, PIN, QR, refresh token |
| Infrastructure | Docker Compose (API + Web + Postgres + Redis), smoke test 14 étapes |
| CI | Backend + Web + Android + Docker smoke (`.github/workflows/ci.yml`) |
| Validation | `npm run verify` — §86 (34/34) + 63 tests + smoke |
| Matériel | Checklist manuelle : `node tailcontrol/scripts/validation-manual.mjs` |

## Dépôt

https://github.com/Percroy2/tailscale-android-tv
