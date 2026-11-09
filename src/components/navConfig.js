export const APPLICANT_LINKS = [
  { to: '/app', label: 'Status', icon: 'home', end: true },
  { to: '/app/profile', label: 'Profile', icon: 'user' },
  { to: '/app/documents', label: 'Documents', icon: 'file' },
];

export const ADMIN_LINKS = [
  { to: '/admin', label: 'Overview', icon: 'chart', end: true },
  { to: '/admin/applicants', label: 'Applicants', icon: 'users' },
];

export const linksFor = (user) => (!user ? [] : user.role === 'admin' ? ADMIN_LINKS : APPLICANT_LINKS);
