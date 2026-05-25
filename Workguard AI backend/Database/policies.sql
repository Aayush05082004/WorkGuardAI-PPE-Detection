-- ====================================
-- ATTENDANCE TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin delete attendance""
ON public.attendance
FOR DELETE
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Manager view attendance""
ON public.attendance
FOR SELECT
USING ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = attendance.site_id) AND (s.manager_id = auth.uid())))))
;

CREATE POLICY ""Supervisor mark attendance""
ON public.attendance
FOR INSERT
WITH CHECK ((get_user_role() = ANY (ARRAY['supervisor'::user_role, 'site_manager'::user_role, 'admin'::user_role])));

CREATE POLICY ""Supervisor update attendance""
ON public.attendance
FOR UPDATE
USING ((get_user_role() = ANY (ARRAY['supervisor'::user_role, 'site_manager'::user_role, 'admin'::user_role])))
WITH CHECK ((get_user_role() = ANY (ARRAY['supervisor'::user_role, 'site_manager'::user_role, 'admin'::user_role])));

CREATE POLICY ""Supervisor view attendance""
ON public.attendance
FOR SELECT
USING ((EXISTS ( SELECT 1
   FROM supervisors sp
  WHERE ((sp.site_id = attendance.site_id) AND (sp.profile_id = auth.uid())))))
;
CREATE POLICY ""Worker attendance access""
ON public.attendance
FOR SELECT
USING ((EXISTS ( SELECT 1
   FROM workers w
  WHERE ((w.id = attendance.worker_id) AND (w.profile_id = auth.uid())))))
;

-- ====================================
-- AUDIT LOGS TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin full access audit""
ON public.audit_logs
FOR ALL
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));

CREATE POLICY ""Manager view audit logs""
ON public.audit_logs
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = audit_logs.site_id) AND (s.manager_id = auth.uid())))))
;

-- ====================================
-- MATERIAL REQUESTS TABLE POLICIES
-- ====================================

CREATE POLICY ""Manager view material requests""
ON public.material_requests
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM (materials m
     JOIN sites s ON ((s.id = m.site_id)))
  WHERE ((m.id = material_requests.material_id) AND (s.manager_id = auth.uid())))))
;

CREATE POLICY ""Supervisor create material requests""
ON public.material_requests
FOR INSERT
TO authenticated
WITH CHECK ((requested_by = auth.uid()));"
"CREATE POLICY ""Manager insert materials""
ON public.materials
FOR INSERT
TO authenticated
WITH CHECK ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = materials.site_id) AND (s.manager_id = auth.uid())))));
  
-- ====================================
-- MATERIALS TABLE POLICIES
-- ====================================

CREATE POLICY ""Manager update materials""
ON public.materials
FOR UPDATE
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = materials.site_id) AND (s.manager_id = auth.uid())))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = materials.site_id) AND (s.manager_id = auth.uid())))));

CREATE POLICY ""Manager view materials""
ON public.materials
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = materials.site_id) AND (s.manager_id = auth.uid())))))
;

CREATE POLICY ""Supervisor view materials""
ON public.materials
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM supervisors sp
  WHERE ((sp.site_id = materials.site_id) AND (sp.profile_id = auth.uid())))))
;

-- ====================================
-- NOTIFICATIONS TABLE POLICIES
-- ====================================

CREATE POLICY ""System insert notifications""
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY ""Users update own notifications""
ON public.notifications
FOR UPDATE
TO authenticated
USING ((recipient_id = auth.uid()))
WITH CHECK ((recipient_id = auth.uid()));

CREATE POLICY ""Users view own notifications""
ON public.notifications
FOR SELECT
TO authenticated
USING ((recipient_id = auth.uid()))
;

-- ====================================
-- PROFILES TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin can view all profiles""
ON public.profiles
FOR SELECT
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Users can update own profile""
ON public.profiles
FOR UPDATE
USING ((auth.uid() = id))
;

CREATE POLICY ""Users can view own profile""
ON public.profiles
FOR SELECT
USING ((auth.uid() = id))
;

-- ====================================
-- SITE INSPECTIONS TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin full access inspections""
ON public.site_inspections
FOR ALL
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'admin'::user_role)))));

CREATE POLICY ""Manager review inspections""
ON public.site_inspections
FOR UPDATE
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM sites si
  WHERE ((si.id = site_inspections.site_id) AND (si.manager_id = auth.uid())))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM sites si
  WHERE ((si.id = site_inspections.site_id) AND (si.manager_id = auth.uid())))));

CREATE POLICY ""Manager view site inspections""
ON public.site_inspections
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM (sites si
     JOIN profiles p ON ((p.id = auth.uid())))
  WHERE ((si.id = site_inspections.site_id) AND (si.manager_id = p.id) AND (si.is_deleted = false)))))
;

CREATE POLICY ""Supervisor update own inspections""
ON public.site_inspections
FOR UPDATE
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = site_inspections.supervisor_id) AND (s.profile_id = auth.uid())))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = site_inspections.supervisor_id) AND (s.profile_id = auth.uid())))));

CREATE POLICY ""Supervisor upload inspection""
ON public.site_inspections
FOR INSERT
TO authenticated
WITH CHECK ((EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = site_inspections.supervisor_id) AND (s.profile_id = auth.uid()) AND (s.is_deleted = false)))));

CREATE POLICY ""Supervisor view own inspections""
ON public.site_inspections
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = site_inspections.supervisor_id) AND (s.profile_id = auth.uid())))))
;

CREATE POLICY ""System update AI results""
ON public.site_inspections
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- ====================================
-- SITES TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin delete sites""
ON public.sites
FOR DELETE
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Admin update sites""
ON public.sites
FOR UPDATE
USING (((is_deleted = false) AND (get_user_role() = 'admin'::user_role)))
;

CREATE POLICY ""Manager update own sites""
ON public.sites
FOR UPDATE
USING (((manager_id = auth.uid()) AND (is_deleted = false)))
;

CREATE POLICY ""Managers create sites""
ON public.sites
FOR INSERT
WITH CHECK ((get_user_role() = ANY (ARRAY['admin'::user_role, 'site_manager'::user_role])));

CREATE POLICY ""Managers view own sites""
ON public.sites
FOR SELECT
USING (((manager_id = auth.uid()) AND (is_deleted = false)))
;

-- ====================================
-- SUPERVISORS TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin delete supervisors""
ON public.supervisors
FOR DELETE
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Admin full access supervisors""
ON public.supervisors
FOR ALL
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Admin update supervisors""
ON public.supervisors
FOR UPDATE
USING (((is_deleted = false) AND (get_user_role() = 'admin'::user_role)))
;

CREATE POLICY ""Manager view supervisors""
ON public.supervisors
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM sites st
  WHERE ((st.id = supervisors.site_id) AND (st.manager_id = auth.uid()))))))
;

CREATE POLICY ""Supervisor view own record""
ON public.supervisors
FOR SELECT
USING (((profile_id = auth.uid()) AND (is_deleted = false)))
;

-- ====================================
-- TASKS TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin delete tasks""
ON public.tasks
FOR DELETE
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Admin update tasks""
ON public.tasks
FOR UPDATE
USING (((is_deleted = false) AND (get_user_role() = 'admin'::user_role)))
;

CREATE POLICY ""Manager update tasks""
ON public.tasks
FOR UPDATE
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM sites st
  WHERE ((st.id = tasks.site_id) AND (st.manager_id = auth.uid()))))))
;

CREATE POLICY ""Manager view tasks""
ON public.tasks
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM sites st
  WHERE ((st.id = tasks.site_id) AND (st.manager_id = auth.uid()))))))
;
CREATE POLICY ""Supervisor create tasks""
ON public.tasks
FOR INSERT
WITH CHECK ((get_user_role() = ANY (ARRAY['supervisor'::user_role, 'site_manager'::user_role, 'admin'::user_role])));"
"CREATE POLICY ""Supervisor update tasks""
ON public.tasks
FOR UPDATE
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = tasks.assigned_supervisor) AND (s.profile_id = auth.uid()))))))
;

CREATE POLICY ""Supervisor view tasks""
ON public.tasks
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.id = tasks.assigned_supervisor) AND (s.profile_id = auth.uid()))))))
;

CREATE POLICY ""Workers view assigned tasks""
ON public.tasks
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM workers w
  WHERE ((w.id = tasks.assigned_worker) AND (w.profile_id = auth.uid()))))))
;

-- ====================================
-- WORKERS TABLE POLICIES
-- ====================================

CREATE POLICY ""Admin delete workers""
ON public.workers
FOR DELETE
USING ((get_user_role() = 'admin'::user_role))
;

CREATE POLICY ""Admin update workers""
ON public.workers
FOR UPDATE
USING (((is_deleted = false) AND (get_user_role() = 'admin'::user_role)))
;

CREATE POLICY ""Manager insert workers only own site""
ON public.workers
FOR INSERT
WITH CHECK ((EXISTS ( SELECT 1
   FROM sites s
  WHERE ((s.id = workers.site_id) AND (s.manager_id = auth.uid())))));

CREATE POLICY ""Manager update workers""
ON public.workers
FOR UPDATE
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM sites st
  WHERE ((st.id = workers.site_id) AND (st.manager_id = auth.uid()))))))
;

CREATE POLICY ""Manager view workers""
ON public.workers
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM sites st
  WHERE ((st.id = workers.site_id) AND (st.manager_id = auth.uid()))))))
;

CREATE POLICY ""Supervisor view workers""
ON public.workers
FOR SELECT
USING (((is_deleted = false) AND (EXISTS ( SELECT 1
   FROM supervisors s
  WHERE ((s.profile_id = auth.uid()) AND (s.site_id = workers.site_id))))))
;

CREATE POLICY ""Worker view own record""
ON public.workers
FOR SELECT
USING (((profile_id = auth.uid()) AND (is_deleted = false)))
;