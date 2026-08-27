# PGP-USS Mobile (Flutter)

App mobile Flutter qui consomme les endpoints du backend Django (DRF + JWT). Le backend, les variables d’environnement et les comptes de test sont documentés dans le [README principal](../README.md), [docs/DEPLOIEMENT.md](../docs/DEPLOIEMENT.md) et [UTILISATEURS_TESTS.md](../UTILISATEURS_TESTS.md).

## Prérequis

- Flutter (SDK 3.x)
- Backend lancé (par défaut: `http://localhost:8000`)

## Lancer l’app

Depuis `mobile/`:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
```

Notes:
- Sur **Android Emulator**, `10.0.2.2` pointe vers votre machine hôte.
- Sur **iOS Simulator**, utilisez généralement `http://localhost:8000`.
- Vous pouvez aussi viser un serveur distant: `--dart-define=API_BASE_URL=https://mon-api.exemple`.

## Écrans inclus (MVP)

- Connexion JWT via `/api/auth/login/`
- Liste des plaintes via `/api/complaints/`
- Détail d’une plainte via `/api/complaints/<id>/`

Pour tester l’application mobile, utiliser les comptes de référence du dépôt et leur mot de passe commun indiqué dans [UTILISATEURS_TESTS.md](../UTILISATEURS_TESTS.md), après avoir lancé le backend et appliqué les migrations.
