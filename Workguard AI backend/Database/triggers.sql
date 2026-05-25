CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_material_requests_updated_at
BEFORE UPDATE ON public.material_requests
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER material_stock_alert_trigger 
AFTER INSERT OR UPDATE ON public.materials 
FOR EACH ROW 
EXECUTE FUNCTION check_material_stock();


CREATE TRIGGER update_materials_updated_at 
BEFORE UPDATE ON public.materials 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON public.profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_inspections_updated_at 
BEFORE UPDATE ON public.site_inspections 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_sites_updated_at 
BEFORE UPDATE ON public.sites 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_supervisors_updated_at 
BEFORE UPDATE ON public.supervisors 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER task_audit_trigger 
AFTER INSERT OR UPDATE ON public.tasks 
FOR EACH ROW 
EXECUTE FUNCTION log_task_changes();


CREATE TRIGGER update_tasks_updated_at 
BEFORE UPDATE ON public.tasks 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();


CREATE TRIGGER update_workers_updated_at 
BEFORE UPDATE ON public.workers 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();