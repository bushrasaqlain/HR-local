import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    userId: null,
    username: "User",
    accountType: "Candidate",
    logo: null
  },
  reducers: {
    setUserFromToken: (state, action) => {
      const { userId, accountType } = action.payload;
      state.userId = userId;
      state.accountType = accountType;
    },
    setUser: (state, action) => {
      const { userId, username, accountType, logo } = action.payload;
      state.userId = userId;
      state.username = username;
      state.accountType = accountType;
      state.logo = logo;
    },
    setLogoUsername: (state, action) => {
        const { username, logo } = action.payload;
        state.username = username;
        state.logo = logo;
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUserFromToken, setUser, setLogoUsername } = userSlice.actions

export default userSlice.reducer