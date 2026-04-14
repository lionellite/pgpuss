## 2025-05-15 - [IDOR and Privilege Escalation in User Management]
**Vulnerability:** UserDetailView allowed any authenticated user to retrieve and update any other user's record (IDOR). Additionally, UserSerializer allowed users to modify their own 'role', 'is_active', and 'establishment' fields (Privilege Escalation).
**Learning:** Default Generic API Views and Serializers in DRF can be overly permissive if not explicitly restricted. `get_queryset` is the correct place to enforce row-level access control, and `read_only_fields` in serializers should always include fields that define user permissions.
**Prevention:** Always override `get_queryset` for Detail views that handle sensitive data, and audit serializers for fields that should be read-only for non-admin users.
