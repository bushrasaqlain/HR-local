
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
  { key: "company", label: "Company List" },
  { key: "candidate", label: "Candidates List" },
  { key: "job", label: "Job List" },
]

export const companymenuitem = [
  {
    key: "profileGroup",
    label: "Profile",
    type: "dropdown",
    children: [
      { key: "profile", label: "Profile" },
      { key: "companyProfile", label: "Update Profile" },
      
    ],
  },


  {
    key: "jobsGroup",
    label: "Jobs",
    type: "dropdown",
    children: [
      { key: "postJob", label: "Post Job" },
      { key: "jobList", label: "Job Post List" },
      { key: "packagesList", label: "Packages List" },
      { key: "pricingform", label: "Pricing Form"},
    ],
  },


  { key: "allApplicants", label: "All Applicants", type: "single" },
  { key: "shortlistedcandidates", label: "Shortlisted", type: "single" },
  { key: "approved", label: "Approved", type: "single" },
];


export const candidatesmenuitem = [
  { key: "profile", label: "Profile" },
  { key: "lists", label: "Job List" },
  // { key: "chatbox", label: "Message"},
  { key: "register", label: "Candidate Register Form"},
]
