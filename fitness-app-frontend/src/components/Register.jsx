import { useState } from "react";
import { Box, Button, TextField, Typography, Alert, Link as MuiLink } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router";
import { setCredentials } from "../store/authSlice";
import { registerUser } from "../services/api";

export default function Register() {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await registerUser(form);
      const { token, userId, email } = response.data;
      // Register returns a token too, so the user is logged in immediately -
      // no separate login step needed, matching the old flow's convenience.
      dispatch(setCredentials({ token, userId, email }));
      navigate("/activities");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
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
        Create Your Account
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Start tracking your fitness activities
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ width: 320, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="First Name" value={form.firstName} onChange={handleChange("firstName")} fullWidth />
        <TextField label="Last Name" value={form.lastName} onChange={handleChange("lastName")} fullWidth />
        <TextField label="Email" type="email" value={form.email} onChange={handleChange("email")} required fullWidth />
        <TextField
          label="Password"
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          required
          fullWidth
          helperText="At least 6 characters"
        />

        <Button type="submit" variant="contained" color="primary" size="large" disabled={loading}>
          {loading ? "Creating account..." : "REGISTER"}
        </Button>

        <Typography variant="body2" align="center">
          Already have an account? <MuiLink component={Link} to="/login">Login</MuiLink>
        </Typography>
      </Box>
    </Box>
  );
}
