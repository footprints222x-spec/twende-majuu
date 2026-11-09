export const GENDERS = [
  ['female', 'Female'],
  ['male', 'Male'],
  ['other', 'Other'],
  ['prefer_not_to_say', 'Prefer not to say'],
];

export const POSITIONS = ['Captain', 'Chef', 'Deckhand', 'Engineer', 'Housekeeper', 'Stewardess'];

export const NATIONALITIES = [
  'Kenyan', 'Ugandan', 'Tanzanian', 'Rwandan', 'Ethiopian', 'South African', 'Zimbabwean', 'Zambian',
  'Mauritian', 'Ghanaian', 'Nigerian', 'Filipino', 'Indonesian', 'Indian', 'Sri Lankan', 'Ukrainian',
  'Romanian', 'Polish', 'Croatian', 'Serbian', 'Bulgarian', 'British', 'American', 'Brazilian', 'Thai',
  'Vietnamese', 'Jamaican',
];

export const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'South Africa', 'Zimbabwe', 'Zambia', 'Mauritius',
  'Ghana', 'Nigeria', 'Philippines', 'Indonesia', 'India', 'Sri Lanka', 'Ukraine', 'Romania', 'Poland',
  'Croatia', 'Serbia', 'Bulgaria', 'United Kingdom', 'United States', 'Brazil', 'Thailand', 'Vietnam',
  'Jamaica', 'Spain', 'Italy', 'Greece', 'Turkey', 'United Arab Emirates',
];

// Mirrors the backend limits (the server still checks everything).
export const MAX_IMAGE_MB = 5;
export const MAX_DOCUMENT_MB = 10;
const IMAGE_EXT = ['jpg', 'jpeg', 'png'];

export const DOC_TYPES = {
  cv: {
    label: 'CV or resume',
    formats: ['pdf', 'docx'],
    single: true,
    help: 'PDF or DOCX, up to 10 MB.',
  },
  passport_photo: {
    label: 'Passport photograph',
    formats: ['jpg', 'jpeg', 'png'],
    single: true,
    help: 'JPG or PNG, up to 5 MB. A clear, front-facing photo.',
  },
  passport_copy: {
    label: 'Passport copy',
    formats: ['pdf', 'jpg', 'jpeg', 'png'],
    single: true,
    help: 'The photo page of your passport. PDF up to 10 MB, or JPG or PNG up to 5 MB.',
  },
  professional_certificate: {
    label: 'Professional certificates',
    formats: ['pdf', 'jpg', 'jpeg', 'png'],
    single: false,
    help: 'Add as many as you need. PDF up to 10 MB, or JPG or PNG up to 5 MB.',
  },
  maritime_certificate: {
    label: 'Maritime training certificates',
    formats: ['pdf', 'jpg', 'jpeg', 'png'],
    single: false,
    help: 'For example basic safety training. PDF up to 10 MB, or JPG or PNG up to 5 MB.',
  },
  other: {
    label: 'Other supporting documents',
    formats: ['pdf', 'docx', 'jpg', 'jpeg', 'png'],
    single: false,
    help: 'References, medical certificates and anything else that supports your application.',
  },
};

export const KEY_DOC_TYPES = ['cv', 'passport_photo', 'passport_copy'];
export const EXTRA_DOC_TYPES = ['professional_certificate', 'maritime_certificate', 'other'];

export const acceptFor = (type) => DOC_TYPES[type].formats.map((e) => `.${e}`).join(',');

/** Returns an error message, or '' if the file looks acceptable. */
export function checkFile(file, type) {
  const rule = DOC_TYPES[type];
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!rule.formats.includes(ext)) {
    return `${rule.label} must be a ${rule.formats.map((e) => e.toUpperCase()).join(', ')} file.`;
  }
  const limit = (IMAGE_EXT.includes(ext) ? MAX_IMAGE_MB : MAX_DOCUMENT_MB) * 1024 * 1024;
  if (file.size > limit) {
    return `That file is too large. The limit for .${ext} files is ${limit / 1024 / 1024} MB.`;
  }
  if (file.size === 0) return 'That file is empty.';
  return '';
}

export const STATUS = {
  pending: {
    label: 'Pending',
    tone: 'neutral',
    hint: 'Your application is in the queue. Complete your profile and upload your documents so it can be reviewed.',
  },
  under_review: {
    label: 'Under review',
    tone: 'info',
    hint: 'Our team is reviewing your profile and documents.',
  },
  shortlisted: {
    label: 'Shortlisted',
    tone: 'accent',
    hint: 'You are on the shortlist. Keep your contact details up to date.',
  },
  approved: {
    label: 'Approved',
    tone: 'success',
    hint: 'Your application has been approved. Keep your passport and contact details up to date.',
  },
  rejected: {
    label: 'Rejected',
    tone: 'danger',
    hint: 'Your application was not successful.',
  },
};
export const STATUS_ORDER = ['pending', 'under_review', 'shortlisted', 'approved'];
export const ALL_STATUSES = [...STATUS_ORDER, 'rejected'];

export const FIELD_LABELS = {
  first_name: 'First name',
  last_name: 'Last name',
  phone: 'Phone number',
  date_of_birth: 'Date of birth',
  gender: 'Gender',
  nationality: 'Nationality',
  country_of_residence: 'Country of residence',
  address: 'Current address',
  passport_number: 'Passport number',
  passport_expiry: 'Passport expiry date',
  position_applied: 'Position',
  years_experience: 'Years of experience',
  biography: 'Biography',
};
