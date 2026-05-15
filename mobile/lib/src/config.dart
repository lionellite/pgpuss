/// Configuration centralisée de l'application PGP-USS.
///
/// L'URL du backend est configurable de 3 façons (par ordre de priorité) :
///
/// 1. **Au lancement** (recommandé) — via `--dart-define` :
///    ```
///    flutter run --dart-define=API_BASE_URL=http://192.168.1.50:8000
///    ```
///
/// 2. **Au build** — pour générer un APK avec une IP spécifique :
///    ```
///    flutter build apk --dart-define=API_BASE_URL=https://pgpuss.gouv.bj
///    ```
///
/// 3. **Par défaut** — si rien n'est spécifié, utilise l'IP ci-dessous.
///
/// Ainsi, vous n'avez jamais besoin de modifier ce fichier.
class AppConfig {
  /// URL de base de l'API Django.
  /// Passée via `--dart-define=API_BASE_URL=...` ou valeur par défaut.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://pgpuss-git-master-lionels-projects-c5af5fda.vercel.app',
  );

  /// Nom de l'application
  static const appName = 'PGP-USS';

  /// Version affichée
  static const appVersion = '1.0.0';
}
