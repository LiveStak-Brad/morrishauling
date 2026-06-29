-- Career templates: extended job postings, applicant fields, application metadata

alter table public.job_postings
  add column if not exists category text,
  add column if not exists schedule text,
  add column if not exists responsibilities text,
  add column if not exists nice_to_have text,
  add column if not exists growth_path text,
  add column if not exists pay_note text,
  add column if not exists department_label text,
  add column if not exists hiring_mode text not null default 'future_opening'
    check (hiring_mode in ('active_hiring', 'accepting_interest', 'future_opening', 'hiring_soon', 'hidden')),
  add column if not exists is_reference_template boolean not null default false,
  add column if not exists sort_order int not null default 0;

alter table public.applicants
  add column if not exists has_drivers_license boolean,
  add column if not exists has_reliable_transportation boolean,
  add column if not exists experience_summary text,
  add column if not exists why_morris text,
  add column if not exists employment_type_preference text;

alter table public.applications
  add column if not exists source text default 'careers_page',
  add column if not exists application_type text not null default 'standard'
    check (application_type in ('standard', 'talent_pool', 'general_interest'));

-- Public careers page: published postings that are not hidden
drop policy if exists "job_postings_public_read" on public.job_postings;
create policy "job_postings_public_read" on public.job_postings for select
  using (
    company_id = public.morris_company_id()
    and status = 'published'
    and hiring_mode <> 'hidden'
  );

-- Seed reference career templates (legitimate templates, not fake applicants)
insert into public.job_postings (
  id, company_id, title, slug, description, requirements, responsibilities,
  nice_to_have, growth_path, employment_type, pay_range_min, pay_range_max,
  pay_range_unit, pay_note, location, schedule, category, department_label,
  hiring_mode, is_reference_template, sort_order, status, published_at
) values
(
  'posting-general-interest', 'morris-hauling',
  'General Application / Future Opportunity', 'general-interest',
  'Not sure which role fits? Submit a general application and we''ll keep your information on file for current and future openings.',
  'Reliable, motivated, and interested in growing with Morris Hauling.',
  'We''ll match your skills and interests to the right role as positions open.',
  null, null, 'w2_full_time', null, null, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO',
  'Flexible — tell us your availability', 'field_operations', 'All Departments',
  'accepting_interest', true, 0, 'published', now()
),
(
  'posting-junk-removal-helper', 'morris-hauling', 'Junk Removal Helper', 'junk-removal-helper',
  'Join our field crew loading junk, furniture, and debris from homes and businesses. This is a hands-on role for reliable people who want to learn the hauling trade.',
  E'• Ability to lift 75+ lbs repeatedly\n• Valid driver''s license preferred\n• Reliable transportation to yard/meet point\n• Positive attitude and teamwork',
  E'• Load and secure items on trucks\n• Protect customer property during removal\n• Follow safety and lifting procedures\n• Assist drivers with on-site estimates when needed',
  'Prior labor, moving, or warehouse experience',
  'Helpers who show up consistently and learn the job can advance to Junk Removal Driver.',
  'w2_full_time', null, null, 'hourly', 'Pay based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 7 AM–5 PM; occasional Saturdays',
  'field_operations', 'Field Operations', 'accepting_interest', true, 10, 'published', now()
),
(
  'posting-junk-removal-driver', 'morris-hauling', 'Junk Removal Driver', 'junk-removal-driver',
  'Drive company trucks to job sites, lead small crews, and deliver professional junk removal service across our service area.',
  E'• Valid driver''s license with clean driving record\n• Ability to lift 75+ lbs\n• 1+ year driving experience preferred\n• Professional customer service',
  E'• Operate box trucks safely on local routes\n• Lead helpers on residential and commercial jobs\n• Communicate with dispatch and customers\n• Complete job paperwork and disposal runs',
  'Box truck or commercial driving experience',
  'Drivers can grow into Crew Leader and help train new team members.',
  'w2_full_time', 18, 24, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 7 AM–5 PM',
  'field_operations', 'Field Operations', 'accepting_interest', true, 20, 'published', now()
),
(
  'posting-crew-leader', 'morris-hauling', 'Crew Leader', 'crew-leader',
  'Run daily crews, ensure quality service, and keep jobs moving efficiently from arrival to disposal.',
  E'• 2+ years junk removal or hauling experience\n• Valid driver''s license\n• Leadership and problem-solving skills\n• Strong safety mindset',
  E'• Lead 2–3 person crews on job sites\n• Train helpers and drivers\n• Quality-check loads and customer satisfaction\n• Report issues to operations',
  null,
  'Crew Leaders may advance into Operations or dispatch leadership roles.',
  'w2_full_time', 22, 28, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 7 AM–5 PM',
  'field_operations', 'Field Operations', 'hiring_soon', true, 30, 'published', now()
),
(
  'posting-hauling-transport-driver', 'morris-hauling', 'Hauling / Transport Driver', 'hauling-transport-driver',
  'Transport materials, equipment, and loads between job sites, yards, and disposal facilities.',
  E'• Valid driver''s license; CDL a plus\n• Clean MVR\n• Ability to lift 50+ lbs\n• Reliable attendance',
  E'• Operate trucks for hauling and transport\n• Secure loads per DOT and company standards\n• Coordinate with dispatch on routes\n• Maintain vehicle cleanliness and pre-trip checks',
  'CDL Class B, DOT medical card', null,
  'w2_full_time', null, null, 'hourly', 'Pay based on experience; CDL premium available',
  'Warren, Lincoln & St. Charles Counties, MO', 'Varies by route; early mornings common',
  'field_operations', 'Field Operations', 'future_opening', true, 40, 'published', now()
),
(
  'posting-equipment-operator', 'morris-hauling', 'Equipment Operator', 'equipment-operator',
  'Operate skid steers, mini excavators, or other equipment for cleanouts, lot clearing, and specialty hauling projects.',
  E'• Equipment operation experience\n• Valid driver''s license\n• Safety-conscious work habits\n• Ability to work outdoors in varied conditions',
  E'• Operate equipment safely on job sites\n• Coordinate with crew for loading and clearing\n• Perform basic equipment inspections\n• Follow site safety protocols',
  null, null, 'w2_full_time', null, null, 'hourly', 'Pay based on experience and certifications',
  'Warren, Lincoln & St. Charles Counties, MO', 'Project-based; typically weekdays',
  'field_operations', 'Field Operations', 'future_opening', true, 50, 'published', now()
),
(
  'posting-weekend-helper', 'morris-hauling', 'Part-Time Weekend Helper', 'part-time-weekend-helper',
  'Flexible weekend role supporting our field crews during peak demand. Great for students or anyone seeking supplemental income.',
  E'• Ability to lift 75+ lbs\n• Reliable transportation\n• Available most Saturdays',
  E'• Assist with loading and site cleanup\n• Follow crew leader direction\n• Maintain professional appearance with customers',
  null, null, 'w2_part_time', 16, 20, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Saturdays; occasional Sundays during busy season',
  'field_operations', 'Field Operations', 'accepting_interest', true, 60, 'published', now()
),
(
  'posting-dispatcher', 'morris-hauling', 'Dispatcher', 'dispatcher',
  'Schedule crews, route jobs, and keep customers informed. The dispatcher is the hub between the field and the office.',
  E'• Strong communication and multitasking\n• Computer and phone skills\n• Calm under pressure\n• Local area knowledge a plus',
  E'• Schedule jobs and assign crews\n• Route trucks efficiently\n• Handle customer calls and updates\n• Track job status in the system',
  null,
  'Dispatchers can grow into Operations Manager as the company scales.',
  'office_staff', 17, 22, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 7 AM–4 PM; on-call rotation possible',
  'dispatch_office', 'Dispatch / Office', 'accepting_interest', true, 70, 'published', now()
),
(
  'posting-customer-service', 'morris-hauling', 'Customer Service Representative', 'customer-service-representative',
  'Answer calls and messages, book jobs, and provide friendly, accurate information to customers.',
  E'• Clear verbal and written communication\n• Customer service experience\n• Basic computer skills\n• Professional phone manner',
  E'• Answer phones, texts, and web inquiries\n• Schedule appointments and send confirmations\n• Document customer requests accurately\n• Escalate complex issues to management',
  null,
  'Customer service reps can move into Estimator or dispatch roles.',
  'office_staff', 16, 20, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 8 AM–5 PM',
  'dispatch_office', 'Dispatch / Office', 'future_opening', true, 80, 'published', now()
),
(
  'posting-estimator', 'morris-hauling', 'Estimator', 'estimator',
  'Provide accurate quotes for junk removal and hauling jobs, both remotely and on-site.',
  E'• Experience in estimates or sales in service trades\n• Valid driver''s license\n• Strong math and communication skills\n• Detail-oriented',
  E'• Review job photos and details for pricing\n• Conduct on-site estimates when needed\n• Explain pricing clearly to customers\n• Coordinate with dispatch on job scope',
  null, null, 'w2_full_time', null, null, 'hourly', 'Pay based on experience; commission potential',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday; some field travel for on-site quotes',
  'dispatch_office', 'Dispatch / Office', 'future_opening', true, 90, 'published', now()
),
(
  'posting-office-assistant', 'morris-hauling', 'Office Assistant', 'office-assistant',
  'Support daily office operations including filing, data entry, and administrative tasks.',
  E'• Organized and dependable\n• Microsoft Office or Google Workspace skills\n• Professional demeanor',
  E'• Data entry and document organization\n• Assist with invoicing and customer records\n• Order office supplies\n• Support HR and operations as needed',
  null, null, 'office_staff', 15, 19, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 8 AM–5 PM',
  'dispatch_office', 'Dispatch / Office', 'future_opening', true, 100, 'published', now()
),
(
  'posting-sales-rep', 'morris-hauling', 'Sales Representative', 'sales-representative',
  'Grow residential and commercial revenue through outbound outreach, referrals, and relationship building.',
  E'• Sales or business development experience\n• Valid driver''s license\n• Self-motivated and goal-oriented',
  E'• Prospect new customers and partners\n• Follow up on leads from marketing\n• Represent Morris Hauling professionally in the community\n• Track pipeline in CRM',
  null, null, 'w2_full_time', null, null, 'hourly', 'Base plus commission based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday; some evenings for follow-ups',
  'business_growth', 'Business / Growth', 'future_opening', true, 110, 'published', now()
),
(
  'posting-commercial-accounts', 'morris-hauling', 'Commercial Accounts Manager', 'commercial-accounts-manager',
  'Manage recurring commercial accounts including property managers, contractors, and businesses.',
  E'• B2B account management experience\n• Strong communication and negotiation skills\n• Valid driver''s license',
  E'• Maintain relationships with commercial clients\n• Coordinate recurring service schedules\n• Resolve account issues quickly\n• Identify upsell opportunities',
  null, null, 'w2_full_time', null, null, 'hourly', 'Pay based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday; flexible for client meetings',
  'business_growth', 'Business / Growth', 'future_opening', true, 120, 'published', now()
),
(
  'posting-marketing-assistant', 'morris-hauling', 'Marketing / Social Media Assistant', 'marketing-social-media-assistant',
  'Help tell the Morris Hauling story online through social media, reviews, and local marketing support.',
  E'• Social media experience\n• Writing and basic photo editing skills\n• Familiarity with local business marketing',
  E'• Post to social channels and respond to comments\n• Request and highlight customer reviews\n• Assist with photos and simple content creation\n• Track basic marketing metrics',
  null, null, 'w2_part_time', 15, 20, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Flexible; 15–25 hours per week',
  'business_growth', 'Business / Growth', 'future_opening', true, 130, 'published', now()
),
(
  'posting-bookkeeper', 'morris-hauling', 'Bookkeeper / Accountant', 'bookkeeper-accountant',
  'Support financial operations including AP/AR, reconciliations, and reporting as we grow.',
  E'• Bookkeeping or accounting experience\n• QuickBooks or similar software\n• Attention to detail and confidentiality',
  E'• Process invoices and payments\n• Reconcile accounts and assist with payroll data\n• Maintain organized financial records\n• Support tax prep with external accountant',
  null, null, 'office_staff', null, null, 'hourly', 'Pay based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 8 AM–5 PM',
  'business_growth', 'Business / Growth', 'future_opening', true, 140, 'published', now()
),
(
  'posting-operations-manager', 'morris-hauling', 'Operations Manager', 'operations-manager',
  'Oversee daily field and dispatch operations, crew performance, and service quality.',
  E'• 3+ years operations leadership in trades or hauling\n• Valid driver''s license\n• Strong leadership and problem-solving',
  E'• Manage crews, routes, and dispatch coordination\n• Improve processes and safety programs\n• Hire and develop field leadership\n• Report KPIs to ownership',
  null, null, 'w2_full_time', null, null, 'hourly', 'Salary based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday; field presence as needed',
  'business_growth', 'Business / Growth', 'future_opening', true, 150, 'published', now()
),
(
  'posting-mechanic', 'morris-hauling', 'Mechanic / Fleet Maintenance', 'mechanic-fleet-maintenance',
  'Maintain and repair company trucks and equipment to keep our fleet on the road.',
  E'• Automotive or diesel mechanic experience\n• Own tools preferred\n• Valid driver''s license',
  E'• Perform preventive maintenance on fleet vehicles\n• Diagnose and repair mechanical issues\n• Track maintenance records\n• Coordinate with vendors for major repairs',
  null, null, 'w2_full_time', null, null, 'hourly', 'Pay based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, shop hours',
  'future_specialty', 'Future / Specialty', 'future_opening', true, 160, 'published', now()
),
(
  'posting-disposal-coordinator', 'morris-hauling', 'Disposal & Recycling Coordinator', 'disposal-recycling-coordinator',
  'Coordinate disposal routes, vendor relationships, and recycling compliance as volume grows.',
  E'• Logistics or operations coordination experience\n• Organized and analytical\n• Valid driver''s license a plus',
  E'• Manage disposal site relationships and pricing\n• Track load tickets and compliance\n• Optimize disposal routing with operations\n• Report on diversion and costs',
  null, null, 'office_staff', null, null, 'hourly', 'Pay based on experience',
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 8 AM–5 PM',
  'future_specialty', 'Future / Specialty', 'future_opening', true, 170, 'published', now()
),
(
  'posting-warehouse-yard', 'morris-hauling', 'Warehouse / Yard Assistant', 'warehouse-yard-assistant',
  'Organize the yard, stage equipment, and support inventory as we expand facilities.',
  E'• Ability to lift 75+ lbs\n• Forklift experience a plus\n• Reliable attendance',
  E'• Organize yard and storage areas\n• Stage equipment for daily routes\n• Assist with inventory counts\n• Maintain a safe, clean work environment',
  null, null, 'w2_full_time', 16, 20, 'hourly', null,
  'Warren, Lincoln & St. Charles Counties, MO', 'Monday–Friday, 7 AM–4 PM',
  'future_specialty', 'Future / Specialty', 'future_opening', true, 180, 'published', now()
)
on conflict (id) do update set
  title = excluded.title,
  slug = excluded.slug,
  description = excluded.description,
  requirements = excluded.requirements,
  responsibilities = excluded.responsibilities,
  nice_to_have = excluded.nice_to_have,
  growth_path = excluded.growth_path,
  employment_type = excluded.employment_type,
  pay_range_min = excluded.pay_range_min,
  pay_range_max = excluded.pay_range_max,
  pay_note = excluded.pay_note,
  location = excluded.location,
  schedule = excluded.schedule,
  category = excluded.category,
  department_label = excluded.department_label,
  hiring_mode = excluded.hiring_mode,
  is_reference_template = excluded.is_reference_template,
  sort_order = excluded.sort_order,
  status = excluded.status,
  published_at = coalesce(public.job_postings.published_at, excluded.published_at),
  updated_at = now();
