const dropdownItem = (userId, accountType) => {
  const common = [
    {
      id: 2,
      name: "Change Password",
      icon: "la-lock",
      tabKey: "changepassword",
    },
    {
      id: 3,
      name: "Logout",
      icon: "la-sign-out",
      tabKey: "logout",
    },
  ];

  if (accountType === "employer") {
    return [
      {
        id: 1,
        name: "Update Profile",
        icon: "la-user-edit",
        tabKey: "companyProfile",
      },
      ...common,
    ];
  }

  return common;
};

export default dropdownItem;