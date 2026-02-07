-- Insert Resume Data Migration
-- This migration adds comprehensive resume data for all employees
-- Only run AFTER seed.js has created the employees

-- Update Resume for Hazim (Employee ID: 1) with complete data
UPDATE "Resume" SET
  "phone" = '+60-12-345-6789',
  "summary" = 'Experienced software engineer with 6 years of expertise in full-stack development, cloud architecture, and team leadership.',
  "skills" = '["JavaScript","TypeScript","React","Node.js","AWS","Docker","SQL","MongoDB"]',
  "experience" = '[{"role":"Senior Software Engineer","company":"TechCorp Malaysia","duration":"2021 - Present"},{"role":"Software Engineer","company":"Digital Solutions Inc","duration":"2019 - 2021"},{"role":"Junior Developer","company":"StartUp Hub","duration":"2018 - 2019"}]',
  "education" = '[{"degree":"Bachelor of Computer Science","school":"University of Malaya","year":"2018"},{"degree":"Diploma in IT","school":"Kuala Lumpur Polytechnic","year":"2016"}]',
  "resumeText" = 'Hazim - Software Engineer
Senior Software Engineer with 6+ years of experience in full-stack development.
Skills: JavaScript, TypeScript, React, Node.js, AWS, Docker, SQL, MongoDB
Experience:
- Senior Software Engineer at TechCorp Malaysia (2021-Present)
- Software Engineer at Digital Solutions Inc (2019-2021)
- Junior Developer at StartUp Hub (2018-2019)
Education:
- Bachelor of Computer Science from University of Malaya (2018)
- Diploma in IT from Kuala Lumpur Polytechnic (2016)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "employeeId" = 1;

-- Update Resume for Sarah (Employee ID: 2) with complete data
UPDATE "Resume" SET
  "phone" = '+65-98-765-4321',
  "summary" = 'Product Manager with 8 years of experience in agile product development, user research, and cross-functional team management.',
  "skills" = '["Product Strategy","User Research","Agile/Scrum","Data Analysis","Figma","SQL","A/B Testing","Cross-functional Leadership"]',
  "experience" = '[{"role":"Senior Product Manager","company":"Global Tech Singapore","duration":"2020 - Present"},{"role":"Product Manager","company":"InnovateTech","duration":"2018 - 2020"},{"role":"Associate Product Manager","company":"WebServices Asia","duration":"2016 - 2018"}]',
  "education" = '[{"degree":"MBA in Business Administration","school":"National University of Singapore","year":"2018"},{"degree":"Bachelor of Business","school":"Nanyang Technological University","year":"2015"}]',
  "resumeText" = 'Sarah - Product Manager
Senior Product Manager with 8+ years of experience in product development.
Skills: Product Strategy, User Research, Agile/Scrum, Data Analysis, Figma, SQL, A/B Testing
Experience:
- Senior Product Manager at Global Tech Singapore (2020-Present)
- Product Manager at InnovateTech (2018-2020)
- Associate Product Manager at WebServices Asia (2016-2018)
Education:
- MBA in Business Administration from National University of Singapore (2018)
- Bachelor of Business from Nanyang Technological University (2015)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "employeeId" = 2;

-- Update Resume for Ahmad (Employee ID: 3) with complete data
UPDATE "Resume" SET
  "phone" = '+60-19-876-5432',
  "summary" = 'Marketing Manager with 5 years of experience in digital marketing, brand strategy, and campaign management across Southeast Asia.',
  "skills" = '["Digital Marketing","SEO/SEM","Social Media Management","Content Strategy","Brand Management","Analytics","Email Marketing","Campaign Management"]',
  "experience" = '[{"role":"Marketing Manager","company":"BrandWorks Malaysia","duration":"2022 - Present"},{"role":"Marketing Specialist","company":"Digital Agency Pro","duration":"2020 - 2022"},{"role":"Marketing Coordinator","company":"Creative Solutions Ltd","duration":"2019 - 2020"}]',
  "education" = '[{"degree":"Bachelor of Marketing","school":"Universiti Utara Malaysia","year":"2019"},{"degree":"Diploma in Business","school":"KL Commerce Academy","year":"2017"}]',
  "resumeText" = 'Ahmad - Marketing Manager
Marketing Manager with 5+ years of experience in digital marketing and brand strategy.
Skills: Digital Marketing, SEO/SEM, Social Media Management, Content Strategy, Brand Management
Experience:
- Marketing Manager at BrandWorks Malaysia (2022-Present)
- Marketing Specialist at Digital Agency Pro (2020-2022)
- Marketing Coordinator at Creative Solutions Ltd (2019-2020)
Education:
- Bachelor of Marketing from Universiti Utara Malaysia (2019)
- Diploma in Business from KL Commerce Academy (2017)',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "employeeId" = 3;
