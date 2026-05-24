import 'token_pair.dart';
import 'user.dart';

class LoginResult {
  const LoginResult({
    required this.tokens,
    required this.user,
  });

  final TokenPair tokens;
  final AppUser user;

  factory LoginResult.fromJson(Map<String, dynamic> json) {
    return LoginResult(
      tokens: TokenPair.fromJson(json),
      user: AppUser.fromJson(
        (json['user'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }
}
