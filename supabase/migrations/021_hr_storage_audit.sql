-- Storage buckets documentation and HR seed data

-- Note: Supabase storage buckets are created via dashboard or supabase CLI:
--   hr-documents (private)
--   applicant-documents (private)
-- Application code uses service role for uploads.

-- Seed default departments and positions
insert into public.departments (id, company_id, name, description) values
  ('dept-operations', 'morris-hauling', 'Operations', 'Field crews and drivers'),
  ('dept-office', 'morris-hauling', 'Office', 'Administrative staff'),
  ('dept-dispatch', 'morris-hauling', 'Dispatch', 'Scheduling and routing')
on conflict (id) do nothing;

insert into public.positions (id, company_id, department_id, title) values
  ('pos-driver', 'morris-hauling', 'dept-operations', 'Driver'),
  ('pos-helper', 'morris-hauling', 'dept-operations', 'Helper'),
  ('pos-lead', 'morris-hauling', 'dept-operations', 'Lead Technician'),
  ('pos-dispatcher', 'morris-hauling', 'dept-dispatch', 'Dispatcher'),
  ('pos-office', 'morris-hauling', 'dept-office', 'Office Administrator')
on conflict (id) do nothing;

-- Seed onboarding templates
insert into public.onboarding_templates (id, company_id, name, employment_type) values
  ('onb-w2-ft', 'morris-hauling', 'W-2 Full Time Onboarding', 'w2_full_time'),
  ('onb-w2-pt', 'morris-hauling', 'W-2 Part Time Onboarding', 'w2_part_time'),
  ('onb-1099', 'morris-hauling', '1099 Contractor Onboarding', '1099_contractor')
on conflict (id) do nothing;

insert into public.onboarding_template_items (id, company_id, template_id, item_key, label, is_required, sort_order) values
  ('onbi-1', 'morris-hauling', 'onb-w2-ft', 'personal_info', 'Personal Information', true, 1),
  ('onbi-2', 'morris-hauling', 'onb-w2-ft', 'emergency_contact', 'Emergency Contact', true, 2),
  ('onbi-3', 'morris-hauling', 'onb-w2-ft', 'drivers_license', 'Driver''s License', true, 3),
  ('onbi-4', 'morris-hauling', 'onb-w2-ft', 'ssn', 'Social Security Number', true, 4),
  ('onbi-5', 'morris-hauling', 'onb-w2-ft', 'tax_documents', 'Tax Documents (W-4)', true, 5),
  ('onbi-6', 'morris-hauling', 'onb-w2-ft', 'direct_deposit', 'Direct Deposit', true, 6),
  ('onbi-7', 'morris-hauling', 'onb-w2-ft', 'uniform_sizes', 'Uniform Sizes', true, 7),
  ('onbi-8', 'morris-hauling', 'onb-w2-ft', 'equipment', 'Equipment Assignment', true, 8),
  ('onbi-9', 'morris-hauling', 'onb-w2-ft', 'handbook', 'Employee Handbook', true, 9),
  ('onbi-10', 'morris-hauling', 'onb-w2-ft', 'safety_training', 'Safety Training', true, 10),
  ('onbi-11', 'morris-hauling', 'onb-w2-ft', 'vehicle_training', 'Vehicle Training', false, 11),
  ('onbi-12', 'morris-hauling', 'onb-w2-ft', 'lift_training', 'Lift Training', true, 12),
  ('onbi-13', 'morris-hauling', 'onb-w2-ft', 'dot_documents', 'DOT Documents', false, 13),
  ('onbi-14', 'morris-hauling', 'onb-w2-ft', 'digital_signature', 'Digital Signature', true, 14),
  ('onbi-1099-1', 'morris-hauling', 'onb-1099', 'personal_info', 'Personal Information', true, 1),
  ('onbi-1099-2', 'morris-hauling', 'onb-1099', 'w9', 'W-9 Form', true, 2),
  ('onbi-1099-3', 'morris-hauling', 'onb-1099', 'contractor_agreement', 'Independent Contractor Agreement', true, 3),
  ('onbi-1099-4', 'morris-hauling', 'onb-1099', 'liability_waiver', 'Liability Waiver', true, 4),
  ('onbi-1099-5', 'morris-hauling', 'onb-1099', 'insurance_verification', 'Insurance Verification', true, 5),
  ('onbi-1099-6', 'morris-hauling', 'onb-1099', 'direct_deposit', 'Direct Deposit', true, 6),
  ('onbi-1099-7', 'morris-hauling', 'onb-1099', 'equipment_agreement', 'Equipment Agreement', true, 7),
  ('onbi-1099-8', 'morris-hauling', 'onb-1099', 'digital_signature', 'Digital Signature', true, 8)
on conflict (id) do nothing;

-- Seed document templates
insert into public.document_templates (id, company_id, document_key, name, version, employment_types, is_required) values
  ('doct-i9', 'morris-hauling', 'i9', 'Form I-9', 1, '{w2_full_time,w2_part_time,seasonal,temporary,office_staff}', true),
  ('doct-w4', 'morris-hauling', 'w4', 'Federal W-4', 1, '{w2_full_time,w2_part_time,seasonal,temporary,office_staff}', true),
  ('doct-handbook', 'morris-hauling', 'handbook', 'Employee Handbook', 1, '{w2_full_time,w2_part_time,seasonal,temporary,office_staff}', true),
  ('doct-safety', 'morris-hauling', 'safety_agreement', 'Safety Agreement', 1, '{w2_full_time,w2_part_time,seasonal,temporary}', true),
  ('doct-w9', 'morris-hauling', 'w9', 'Form W-9', 1, '{1099_contractor}', true),
  ('doct-contractor', 'morris-hauling', 'contractor_agreement', 'Independent Contractor Agreement', 1, '{1099_contractor}', true)
on conflict (id) do nothing;

-- Operational records (equipment catalog, job postings, training stubs) are admin-created.
-- See migrations 024 (training curriculum) and 030 (data legitimacy).
