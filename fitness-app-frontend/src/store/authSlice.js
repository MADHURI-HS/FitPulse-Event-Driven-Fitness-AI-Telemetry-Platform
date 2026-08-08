import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    userId: localStorage.getItem('userId') || null,
    email: localStorage.getItem('email') || null,
  },
  reducers: {
    // Called after a successful /api/users/login or /api/users/register
    // response: { token, userId, email }
    setCredentials: (state, action) => {
      const { token, userId, email } = action.payload;
      state.token = token;
      state.userId = userId;
      state.email = email;

      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('email', email);
    },
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.email = null;

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
