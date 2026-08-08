import { useState } from "react";
import { Box, Button, TextField, Typography, Alert, Link as MuiLink } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router";
import { setCredentials } from "../store/authSlice";
import { loginUser } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      const { token, userId, email: returnedEmail } = response.data;
      dispatch(setCredentials({ token, userId, email: returnedEmail }));
      navigate("/activities");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h4" gutterBottom>
        Welcome Back
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Login to access your activities
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: 320, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          fullWidth
        />

        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
          {loading ? "Logging in..." : "LOGIN"}
        </Button>

        <Typography variant="body2" align="center">
          Don't have an account? <MuiLink component={Link} to="/register">Register</MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}
