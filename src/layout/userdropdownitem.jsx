const admindropdwonData = (userId) => {

    return [
    {
      id: 1,
      name: "Change Password",
      icon: "la-lock",
      routePath: `/form/change-password/`,
      active: "",
    },
    {
      id: 2,
      name: "Logout",
      icon: "la-sign-out",
      routePath: "/",
      active: "",
    },
    // {
    //   id: 3,
    //   name: "Delete Profile",
    //   icon: "la-trash",
    //   routePath: "/",
    //   active: "",
    // },
  ];
  };
  
  export default admindropdwonData;