import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

/// Extrait un message lisible depuis une réponse API Django/DRF.
String messageFromDio(DioException e, {String fallback = 'Une erreur est survenue.'}) {
  final data = e.response?.data;
  if (data is Map) {
    final detail = data['detail'];
    if (detail is List && detail.isNotEmpty) {
      return detail.first.toString();
    }
    if (detail is String && detail.isNotEmpty) {
      return detail;
    }
    final nonField = data['non_field_errors'];
    if (nonField is List && nonField.isNotEmpty) {
      return nonField.first.toString();
    }
    final parts = <String>[];
    for (final entry in data.entries) {
      if (entry.key == 'detail') continue;
      final val = entry.value;
      if (val is List) {
        parts.add('${entry.key}: ${val.join(', ')}');
      } else if (val != null) {
        parts.add(val.toString());
      }
    }
    if (parts.isNotEmpty) return parts.join('\n');
  }
  if (e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.receiveTimeout ||
      e.type == DioExceptionType.connectionError) {
    return 'Connexion impossible. Vérifiez votre réseau.';
  }
  return fallback;
}

void showErrorSnackBar(
  ScaffoldMessengerState messenger,
  String message,
) {
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFE8112D),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 5),
      ),
    );
}
