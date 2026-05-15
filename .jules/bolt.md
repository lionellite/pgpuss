
## 2025-05-22 - [Optimized Complaint List N+1 queries]
**Learning:** Found an N+1 query bottleneck in the Complaint list view where attachment counts were being fetched individually for each item.
**Action:** Used Django's `.annotate(Count('attachments'))` in the queryset and updated the serializer to use this annotated field, reducing queries from 1+N to a constant number.
