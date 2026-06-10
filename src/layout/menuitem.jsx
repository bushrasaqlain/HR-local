export const pageItems = [
  {
    name: "About",
    routePath: "/about",
  },
  {
    name: "Pricing",
    routePath: "/pricing",
  },
  {
    name: "FAQ's",
    routePath: "/faq",
  },
  {
    name: "Terms",
    routePath: "/terms",
  },
];

export const dbadminmenuitem = [
  {
    key: "locationGroup",
    label: "Locations",
    children: [
      { key: "country", label: "Countries" },
      { key: "district", label: "Districts" },
      { key: "city", label: "Cities" },
    ],
  },
  {
    key: "educationGroup",
    label: "Education",
    children: [
      { key: "institute", label: "Institutes" },
      { key: "degreetype", label: "Degree Types" },
      { key: "degreefields", label: "Degree Fields" },
      { key: "skills", label: "Skills" },
      { key: "speciality", label: "Specialties" },
    ],
  },
  {
    key: "businessGroup",
    label: "Business",  
    children: [
      { key: "businessentitytypes", label: "Business Entities" },
      { key: "jobtypes", label: "Job Types" },
      { key: "jobtitles", label: "Job Titles" },
      {key: "industry", label: "Industry"},
      { key: "packages", label: "Packages" },
      { key: "licensetypes", label: "License Types" },
    ],
  },
  {
    key: "financeGroup",
    label: "Finance",
    children: [
      { key: "bank", label: "Banks" },
      { key: "currency", label: "Currencies" },
    ],
  },
];

export const regadminmenuitem = [
  { key: "lists",    label: "Lists"   },
  { key: "other",    label: "Other"   },
  { key: "revenue",  label: "Revenue" },
  // { key: "changepassword", label: "Change Password" },
];
export const companymenuitem = [
  { key: "profile", label: "Dashboard" },
  { key: "jobList", label: "Jobs" },
  { key: "allApplicants", label: "Applicants" },
  { key: "availableCandidates", label: "Available Candidates" },
  { key: "wallet", label: "Wallet", type: "single" },
];

export const candidatesmenuitem = [
  { key: "profile", label: "Dashboard" },
  { key: "lists", label: "Job List" },
  { key: "appliedJobs", label: "Applied Jobs" },
  // { key: "chatbox", label: "Message"},
  { key: "register", label: "Candidate Register Form" },
  {key: "candidatewallet", label: "Wallet", type: "single"},
];
