## 2025-05-15 - [IDOR and Privilege Escalation in User Management]
**Vulnerability:** UserDetailView allowed any authenticated user to retrieve and update any other user's record (IDOR). Additionally, UserSerializer allowed users to modify their own 'role', 'is_active', and 'establishment' fields (Privilege Escalation).
**Learning:** Default Generic API Views and Serializers in DRF can be overly permissive if not explicitly restricted. `get_queryset` is the correct place to enforce row-level access control, and `read_only_fields` in serializers should always include fields that define user permissions.
**Prevention:** Always override `get_queryset` for Detail views that handle sensitive data, and audit serializers for fields that should be read-only for non-admin users.

## 2025-05-16 - [Centralized Queryset Filtering for IDOR Prevention]
**Vulnerability:** IDOR (Insecure Direct Object Reference) in `ComplaintDetailView`, `ComplaintAttachmentView`, and several complaint action endpoints. Users could access or modify complaints belonging to other establishments by manipulating the ID in the URL.
**Learning:** Securing the `ListAPIView` is not enough; `RetrieveUpdateAPIView` and custom `APIView` endpoints must also restrict their querysets or perform explicit ownership checks. Using `get_object_or_404(FilteredQueryset, pk=pk)` is an effective way to enforce these checks consistently.
**Prevention:** Use a centralized helper function to define authorized querysets based on user roles and apply it to all views (List, Detail, and Action) to ensure consistent authorization logic across the application.
