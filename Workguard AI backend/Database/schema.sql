-- ====================================
-- ATTENDANCE TABLE
-- ====================================

CREATE TABLE public.attendance (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  worker_id uuid NOT NULL,
  site_id uuid NOT NULL,
  marked_by uuid NOT NULL,
  attendance_date date NOT NULL,
  status USER-DEFINED NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id),
  CONSTRAINT attendance_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.profiles(id)
);

-- ====================================
-- AUDIT LOG TABLE
-- ====================================

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_id uuid,
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action USER-DEFINED NOT NULL,
  old_data jsonb,
  new_data jsonb,
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);

-- ====================================
-- LEAVE REQUEST TABLE
-- ====================================

CREATE TABLE public.leave_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  worker_id uuid,
  site_id uuid,
  leave_date date NOT NULL,
  leave_type text DEFAULT 'Casual'::text,
  reason text,
  status text DEFAULT 'Pending'::text,
  review_note text,
  reviewed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT leave_requests_pkey PRIMARY KEY (id),
  CONSTRAINT leave_requests_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id),
  CONSTRAINT leave_requests_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);

-- ====================================
-- MATERIAL REQUEST TABLE
-- ====================================

CREATE TABLE public.material_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  material_id uuid NOT NULL,
  requested_by uuid NOT NULL,
  approved_by uuid,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  status text DEFAULT 'pending'::text,
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT material_requests_pkey PRIMARY KEY (id),
  CONSTRAINT material_requests_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id),
  CONSTRAINT material_requests_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.profiles(id),
  CONSTRAINT material_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles(id)
);

-- ====================================
-- MATERIAL TABLE
-- ====================================

CREATE TABLE public.materials (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL,
  material_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0 CHECK (quantity >= 0::numeric),
  unit text NOT NULL,
  minimum_required numeric DEFAULT 0 CHECK (minimum_required >= 0::numeric),
  status USER-DEFINED DEFAULT 'available'::material_status,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT materials_pkey PRIMARY KEY (id),
  CONSTRAINT materials_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT materials_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ====================================
-- NOTIFICATION TABLE
-- ====================================

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recipient_id uuid NOT NULL,
  sender_id uuid,
  site_id uuid,
  title text NOT NULL,
  message text NOT NULL,
  type USER-DEFINED NOT NULL,
  priority USER-DEFINED DEFAULT 'normal'::notification_priority,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT notifications_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id)
);

-- ====================================
-- PROFILES TABLE
-- ====================================

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text UNIQUE CHECK (char_length(phone) >= 10),
  role USER-DEFINED NOT NULL DEFAULT 'worker'::user_role,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ====================================
-- SITE INSPECTIONS TABLE
-- ====================================

CREATE TABLE public.site_inspections (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL,
  supervisor_id uuid NOT NULL,
  image_path text NOT NULL,
  ai_result text,
  confidence numeric,
  remarks text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_status text DEFAULT 'pending'::text,
  has_violation boolean DEFAULT false,
  CONSTRAINT site_inspections_pkey PRIMARY KEY (id),
  CONSTRAINT site_inspections_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT site_inspections_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.supervisors(id),
  CONSTRAINT site_inspections_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);

-- ====================================
-- SITES TABLE
-- ====================================

CREATE TABLE public.sites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_name text NOT NULL,
  location text NOT NULL,
  description text,
  manager_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  is_deleted boolean DEFAULT false,
  CONSTRAINT sites_pkey PRIMARY KEY (id),
  CONSTRAINT sites_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id),
  CONSTRAINT sites_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ====================================
-- SUPERVISORS TABLE
-- ====================================

CREATE TABLE public.supervisors (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  site_id uuid NOT NULL,
  assigned_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT supervisors_pkey PRIMARY KEY (id),
  CONSTRAINT supervisors_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT supervisors_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT supervisors_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ====================================
-- TASKS TABLE
-- ====================================

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  site_id uuid NOT NULL,
  assigned_worker uuid,
  assigned_supervisor uuid,
  title text NOT NULL,
  description text,
  is_completed boolean DEFAULT false,
  due_date date,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT tasks_assigned_worker_fkey FOREIGN KEY (assigned_worker) REFERENCES public.workers(id),
  CONSTRAINT tasks_assigned_supervisor_fkey FOREIGN KEY (assigned_supervisor) REFERENCES public.supervisors(id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- ====================================
-- WORKERS TABLE
-- ====================================

CREATE TABLE public.workers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL UNIQUE,
  site_id uuid NOT NULL,
  supervisor_id uuid,
  worker_code text NOT NULL UNIQUE,
  salary numeric CHECK (salary >= 0::numeric),
  status USER-DEFINED DEFAULT 'active'::worker_status,
  joined_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  assigned_by uuid,
  is_deleted boolean DEFAULT false,
  CONSTRAINT workers_pkey PRIMARY KEY (id),
  CONSTRAINT workers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT workers_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id),
  CONSTRAINT workers_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES public.supervisors(id),
  CONSTRAINT workers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT workers_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id)
);