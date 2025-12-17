// is active parent check
export const isActiveParent = (data = [], path = "") => {
  if (!Array.isArray(data) || data.length === 0 || !path) return false;

  return data.some(({ items }) =>
    items?.some((menu) =>
      (menu?.routePath || "").replace(/\/\d+/, "") === path.replace(/\/\d+/, "")
    )
  );
};

// is active parent child check
export const isActiveParentChaild = (data = [], path = "") => {
  if (!Array.isArray(data) || data.length === 0 || !path) return false;

  return data.some(
    (menu) =>
      (menu?.routePath || "").replace(/\/\d+/, "") === path.replace(/\/\d+/, "")
  );
};

// is active link check
export const isActiveLink = (menuPath = "", routePath = "") => {
  if (!menuPath || !routePath) return false;

  return menuPath.replace(/\/\d+/, "") === routePath.replace(/\/\d+/, "");
};
