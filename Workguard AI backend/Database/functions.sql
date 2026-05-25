CREATE OR REPLACE FUNCTION public.check_material_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  manager_uuid uuid;
BEGIN

  IF NEW.quantity <= NEW.minimum_required THEN

    UPDATE public.materials
    SET status = 'low_stock'
    WHERE id = NEW.id;

    SELECT manager_id
    INTO manager_uuid
    FROM public.sites
    WHERE id = NEW.site_id;

    PERFORM create_notification(
      manager_uuid,
      NEW.created_by,
      NEW.site_id,
      'Low Material Stock',
      NEW.material_name || ' is running low',
      'material',
      'high',
      jsonb_build_object(
        'material_id', NEW.id,
        'quantity', NEW.quantity
      )
    );

  END IF;

  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.create_audit_log(p_site_id uuid, p_actor_id uuid, p_entity_type text, p_entity_id uuid, p_action audit_action, p_old_data jsonb DEFAULT NULL::jsonb, p_new_data jsonb DEFAULT NULL::jsonb, p_remarks text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    site_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data,
    remarks
  )
  VALUES (
    p_site_id,
    p_actor_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_data,
    p_new_data,
    p_remarks
  );
END;
$function$

CREATE OR REPLACE FUNCTION public.create_notification(p_recipient_id uuid, p_sender_id uuid, p_site_id uuid, p_title text, p_message text, p_type notification_type, p_priority notification_priority DEFAULT 'normal'::notification_priority, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.notifications (
    recipient_id,
    sender_id,
    site_id,
    title,
    message,
    type,
    priority,
    metadata
  )
  VALUES (
    p_recipient_id,
    p_sender_id,
    p_site_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_metadata
  );
END;
$function$


CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
      id,
      full_name,
      email,
      role
  )
  VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'worker')
  );
  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.log_task_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN

  IF TG_OP = 'INSERT' THEN

    PERFORM create_audit_log(
      NEW.site_id,
      NEW.created_by,
      'tasks',
      NEW.id,
      'create',
      NULL,
      to_jsonb(NEW),
      'Task created'
    );

  ELSIF TG_OP = 'UPDATE' THEN

    PERFORM create_audit_log(
      NEW.site_id,
      auth.uid(),
      'tasks',
      NEW.id,
      'update',
      to_jsonb(OLD),
      to_jsonb(NEW),
      'Task updated'
    );

  END IF;

  RETURN NEW;
END;
$function$


CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$


CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$
