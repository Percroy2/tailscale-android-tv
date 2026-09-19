# TailControl — monorepo v1.0

Console d'administration Tailscale pour **Android TV / Fire TV**.

| Dossier | Stack |
|---------|--------|
| `android-tv/` | Kotlin, Compose TV, MVVM, Room, Keystore |
| `backend/` | NestJS, Prisma, PostgreSQL, Redis, WebSocket |
| `web/` | React, TypeScript, TailwindCSS |
| `infrastructure/` | Docker, agent supervision, scripts smoke |

## Commandes

```bash
npm run docker:up    # Stack complète (API :3000, portail :8080)
npm run verify       # artefacts V1 + test:all (§86 + E2E)
npm run build:android # APK debug (SDK + local.properties requis)
npm run test:all     # 47 tests unitaires + 12 E2E + §86
npm run smoke        # Parcours jumelage bout-en-bout
npm run build:web
```

## Android TV

```bash
cd android-tv
cp local.properties.example local.properties
# sdk.dir + tailcontrol.api.baseUrl (IP LAN pour Fire TV)
./gradlew assembleDebug
```

## Validation §86

34 critères structurels : `npm --prefix backend test`  
Fichier : `backend/test/validation.s86.spec.ts`
