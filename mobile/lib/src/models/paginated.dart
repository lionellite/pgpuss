class Paginated<T> {
  const Paginated({
    required this.count,
    required this.next,
    required this.previous,
    required this.results,
  });

  final int count;
  final String? next;
  final String? previous;
  final List<T> results;

  static Paginated<T> fromJson<T>(
    Map<String, dynamic> json, {
    required T Function(Map<String, dynamic>) decode,
  }) {
    final resultsRaw = (json['results'] as List?) ?? const [];
    return Paginated(
      count: (json['count'] as int?) ?? resultsRaw.length,
      next: json['next'] as String?,
      previous: json['previous'] as String?,
      results: resultsRaw
          .whereType<Map<String, dynamic>>()
          .map(decode)
          .toList(growable: false),
    );
  }
}

