
## 2025-05-22 - [Optimized Complaint List N+1 queries]
**Learning:** Found an N+1 query bottleneck in the Complaint list view where attachment counts were being fetched individually for each item.
**Action:** Used Django's `.annotate(Count('attachments'))` in the queryset and updated the serializer to use this annotated field, reducing queries from 1+N to a constant number.

## 2025-05-23 - [Optimized Dashboard KPI Aggregation]
**Learning:** Multiple individual  queries in a single view can significantly increase latency. Combining them into a single `.aggregate()` call with conditional `Q` objects reduces database round-trips. Moving Python-level calculations (like averaging time durations) to the database using `Avg` and `ExpressionWrapper` further improves efficiency and accuracy.
**Action:** Always prefer conditional aggregation for dashboard KPIs and offload duration calculations to the database using `DurationField`.

## 2025-05-23 - [Optimized Dashboard KPI Aggregation]
**Learning:** Multiple individual .count() queries in a single view can significantly increase latency. Combining them into a single .aggregate() call with conditional Q objects reduces database round-trips. Moving Python-level calculations (like averaging time durations) to the database using Avg and ExpressionWrapper further improves efficiency and accuracy.
**Action:** Always prefer conditional aggregation for dashboard KPIs and offload duration calculations to the database using DurationField.
