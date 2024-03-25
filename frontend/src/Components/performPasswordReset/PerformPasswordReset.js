import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const PerformPasswordReset = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { userId, token } = useParams(); // Grab the userId and token from URL
  const navigate = useNavigate();

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordsMatch(e.target.value === confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setPasswordsMatch(password === e.target.value);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await axios.post(`${process.env.REACT_APP_BACK_END_URL}/api/passwordRecovery/performPasswordReset/${userId}/${token}`, {
        password: password,
        confirmPassword: password,
      });
      navigate("/");
    } catch (error) {
      setError("An error occurred while updating the password.");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2>Reset Your Password</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="New Password"
                name="password"
                value={password}
                className="ps-2"
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                className="ps-2"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                isInvalid={!passwordsMatch}
                required
              />
              {!passwordsMatch && (
                <Form.Control.Feedback type="invalid">
                  Passwords do not match.
                </Form.Control.Feedback>
              )}
            </Form.Group>
            <div className="d-flex justify-content-center">
              {" "}
              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-1"
                disabled={!passwordsMatch || loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default PerformPasswordReset;
