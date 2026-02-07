export type KBFile = {
  id: string
  filename: string
  name: string
  category: 'Policy' | 'Procedure' | 'FAQ' | 'Manual' | 'Other'
  description: string
  uploader: string
  uploadDate: string
  deletedAt?: string | null
}

export const SAMPLE_FILES: KBFile[] = [
  { id: '1690000000001_employee-handbook.pdf', filename: '1690000000001_employee-handbook.pdf', name: 'employee-handbook', category: 'Manual', description: 'Company handbook', uploader: 'admin', uploadDate: new Date(Date.now() - 86400000 * 10).toISOString(), deletedAt: null },
  { id: '1690000000002_leave-policy.pdf', filename: '1690000000002_leave-policy.pdf', name: 'leave-policy', category: 'Policy', description: 'Annual leave rules', uploader: 'hr', uploadDate: new Date(Date.now() - 86400000 * 9).toISOString(), deletedAt: null },
  { id: '1690000000003_expense-procedure.docx', filename: '1690000000003_expense-procedure.docx', name: 'expense-procedure', category: 'Procedure', description: 'Claim workflow', uploader: 'ops', uploadDate: new Date(Date.now() - 86400000 * 8).toISOString(), deletedAt: null },
  { id: '1690000000004_remote-work-faq.txt', filename: '1690000000004_remote-work-faq.txt', name: 'remote-work-faq', category: 'FAQ', description: 'FAQs for remote policy', uploader: 'admin', uploadDate: new Date(Date.now() - 86400000 * 7).toISOString(), deletedAt: null },
  { id: '1690000000005_security-policy.pdf', filename: '1690000000005_security-policy.pdf', name: 'security-policy', category: 'Policy', description: 'InfoSec guidelines', uploader: 'security', uploadDate: new Date(Date.now() - 86400000 * 6).toISOString(), deletedAt: null },
  { id: '1690000000006_onboarding-checklist.docx', filename: '1690000000006_onboarding-checklist.docx', name: 'onboarding-checklist', category: 'Procedure', description: 'New hire steps', uploader: 'hr', uploadDate: new Date(Date.now() - 86400000 * 5).toISOString(), deletedAt: null },
  { id: '1690000000007_travel-policy.pdf', filename: '1690000000007_travel-policy.pdf', name: 'travel-policy', category: 'Policy', description: 'Travel and lodging', uploader: 'finance', uploadDate: new Date(Date.now() - 86400000 * 4).toISOString(), deletedAt: null },
  { id: '1690000000008_it-usage-manual.pdf', filename: '1690000000008_it-usage-manual.pdf', name: 'it-usage-manual', category: 'Manual', description: 'IT access and usage', uploader: 'it', uploadDate: new Date(Date.now() - 86400000 * 3).toISOString(), deletedAt: null },
  { id: '1690000000009_performance-faq.txt', filename: '1690000000009_performance-faq.txt', name: 'performance-faq', category: 'FAQ', description: 'Performance review FAQs', uploader: 'hr', uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), deletedAt: null },
  { id: '1690000000010_grievance-procedure.docx', filename: '1690000000010_grievance-procedure.docx', name: 'grievance-procedure', category: 'Procedure', description: 'How to raise issues', uploader: 'hr', uploadDate: new Date(Date.now() - 86400000 * 1).toISOString(), deletedAt: null },
  { id: '1690000000011_compensation-policy.pdf', filename: '1690000000011_compensation-policy.pdf', name: 'compensation-policy', category: 'Policy', description: 'Salary bands and raises', uploader: 'finance', uploadDate: new Date(Date.now() - 3600000 * 12).toISOString(), deletedAt: null },
  { id: '1690000000012_code-of-conduct.pdf', filename: '1690000000012_code-of-conduct.pdf', name: 'code-of-conduct', category: 'Policy', description: 'Workplace behavior', uploader: 'admin', uploadDate: new Date().toISOString(), deletedAt: null },
]
