CREATE TYPE public.attendance_status AS ENUM (
  'present',
  'absent',
  'half_day',
  'leave'
);

CREATE TYPE public.audit_action AS ENUM (
  'create',
  'update',
  'delete',
  'assign',
  'complete',
  'review',
  'approve',
  'reject',
  'upload',
  'mark'
);

CREATE TYPE public.material_status AS ENUM (
  'available',
  'low_stock',
  'out_of_stock',
  'ordered'
);

CREATE TYPE public.notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'critical'
);

CREATE TYPE public.notification_type AS ENUM (
  'task',
  'attendance',
  'inspection',
  'material',
  'system',
  'safety',
  'alert'
);

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'site_manager',
  'supervisor',
  'worker'
);

CREATE TYPE public.worker_status AS ENUM (
  'active',
  'inactive',
  'blocked'
);