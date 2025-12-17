import { configureStore } from "@reduxjs/toolkit";
import jobSlice from "./features/job/jobSlice";
import toggleSlice from "./features/toggle/toggleSlice";
import filterSlice from "./features/filter/filterSlice";
import employerFilterSlice from "./features/filter/employerFilterSlice";
import candidateFilterSlice from "./features/filter/candidateFilterSlice";
import shopSlice from "./features/shop/shopSlice";
import userSlice from "./features/user/userSlice";


export const store = configureStore({
    reducer: {
        user: userSlice,
        job: jobSlice,
        toggle: toggleSlice,
        filter: filterSlice,
        employerFilter: employerFilterSlice,
        candidateFilter: candidateFilterSlice,
        shop: shopSlice,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(),
});
