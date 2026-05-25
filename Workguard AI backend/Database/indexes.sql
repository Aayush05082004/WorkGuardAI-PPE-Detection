-- ====================================
-- ATTENDANCE INDEXES
-- ====================================

CREATE UNIQUE INDEX unique_worker_attendance
ON public.attendance(worker_id, attendance_date);

CREATE INDEX idx_attendance_date
ON public.attendance(attendance_date DESC);

CREATE INDEX idx_attendance_site_id
ON public.attendance(site_id);

CREATE INDEX idx_attendance_worker_id
ON public.attendance(worker_id);

-- ====================================
-- AUDIT LOG INDEXES
-- ====================================

CREATE INDEX idx_audit_logs_actor
ON public.audit_logs(actor_id);

CREATE INDEX idx_audit_logs_created
ON public.audit_logs(created_at DESC);

CREATE INDEX idx_audit_logs_entity
ON public.audit_logs(entity_type, entity_id);

CREATE INDEX idx_audit_logs_site
ON public.audit_logs(site_id);

-- ====================================
-- LEAVE REQUEST INDEXES
-- ====================================

CREATE INDEX idx_leave_site
ON public.leave_requests(site_id);

CREATE INDEX idx_leave_worker
ON public.leave_requests(worker_id);

-- ====================================
-- MATERIAL INDEXES
-- ====================================

CREATE INDEX idx_materials_active
ON public.materials(site_id)
WHERE is_deleted = false;

CREATE INDEX idx_materials_status
ON public.materials(status);

-- ====================================
-- NOTIFICATION INDEXES
-- ====================================

CREATE INDEX idx_notifications_created
ON public.notifications(created_at DESC);

CREATE INDEX idx_notifications_recipient
ON public.notifications(recipient_id);

CREATE INDEX idx_notifications_unread
ON public.notifications(recipient_id, is_read);

-- ====================================
-- TASK INDEXES
-- ====================================

CREATE INDEX idx_tasks_created_at
ON public.tasks(created_at DESC);

CREATE INDEX idx_tasks_site_id
ON public.tasks(site_id);

-- ====================================
-- WORKER INDEXES
-- ====================================

CREATE INDEX idx_workers_joined_at
ON public.workers(joined_at DESC);

CREATE INDEX idx_workers_profile_id
ON public.workers(profile_id);

CREATE INDEX idx_workers_site_id
ON public.workers(site_id);

CREATE INDEX idx_workers_supervisor_id
ON public.workers(supervisor_id);