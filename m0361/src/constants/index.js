export const ROLES = { ENTREPRENEUR: 'entrepreneur', INVESTOR: 'investor', ADMIN: 'admin' }
export const INDUSTRIES = ['Fintech','Healthtech','Edtech','SaaS','E-commerce','AI/ML','Climate','Marketplace','DeepTech','Consumer','Logistics','Other']
export const STAGES = ['Idea','Pre-Seed','Seed','Series A','Series B','Growth','Pre-IPO']
export const RISK_LEVELS = ['Low','Medium','High']
export const INVESTMENT_TYPES = ['Equity','Convertible Note','SAFE','Debt']
export const CURRENCIES = ['INR','USD']
export const PAGINATION = { defaultLimit: 12, maxLimit: 50 }

export const NAV_CONFIG = {
  entrepreneur: [
    { group: 'Workspace', items: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
      { label: 'Discover investors', icon: 'Compass', path: '/discover/investors' },
      { label: 'My startup', icon: 'Building2', path: '/startup/profile' },
      { label: 'Requests', icon: 'Users', path: '/requests' },
    ]},
    { group: 'Connect', items: [
      { label: 'Connections', icon: 'BriefcaseBusiness', path: '/connections' },
      { label: 'Messages', icon: 'MessageCircle', path: '/messages' },
    ]},
    { group: 'Manage', items: [
      { label: 'Documents', icon: 'FileText', path: '/documents' },
      { label: 'Settings', icon: 'Settings', path: '/settings' },
    ]},
  ],
  investor: [
    { group: 'Workspace', items: [
      { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
      { label: 'Discover startups', icon: 'Compass', path: '/discover/startups' },
      { label: 'My profile', icon: 'Users', path: '/investor/profile' },
      { label: 'Requests', icon: 'Users', path: '/requests' },
    ]},
    { group: 'Connect', items: [
      { label: 'Connections', icon: 'BriefcaseBusiness', path: '/connections' },
      { label: 'Messages', icon: 'MessageCircle', path: '/messages' },
      { label: 'Favourites', icon: 'Heart', path: '/favourites' },
    ]},
    { group: 'Manage', items: [
      { label: 'Settings', icon: 'Settings', path: '/settings' },
    ]},
  ],
  admin: [
    { group: 'Admin Panel', items: [
      { label: 'Overview', icon: 'LayoutDashboard', path: '/admin/dashboard' },
      { label: 'Users', icon: 'Users', path: '/admin/users' },
      { label: 'Startups', icon: 'Building2', path: '/admin/startups' },
      { label: 'Investors', icon: 'BriefcaseBusiness', path: '/admin/investors' },
      { label: 'Industries', icon: 'Compass', path: '/admin/industries' },
      { label: 'Content', icon: 'FileText', path: '/admin/content' },
      { label: 'Reports', icon: 'FileText', path: '/admin/reports' },
    ]}
  ]
}
