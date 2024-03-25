import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const LoginExistingClient = () => {
  const { signUpCode, token } = useParams();
  const signUpURL = `/sign-up-client/${signUpCode}/${token}`;
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("userData", userData);

      if (
        !userData.email ||
        !userData.password
      ) {
        setError("Please fill in all fields.");
        return;
      }

      const res = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/clients/existingClientLoginForLinking`,
        { ...userData, signUpCode, token }
      );
      const userId = res.data.userId;
      const jwtToken = res.data.token;

      const therapistRes = await axios.get(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/getTheripistIdBySignupCode/${signUpCode}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );
      const therapistId = therapistRes.data.therapist_id;

      console.log("therpistps id", therapistId);

      await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/clients/associateExistingClientWithTherapist`,
        { userId, therapistId },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      navigate("/success?existing=true");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          setError("User not found. (404)");
        } else if (status === 400) {
          setError("User is still linked to another therapist. Please unlink then try again. (400)");
        } else {
          setError(`Error: ${error.message}`);
        }
      } else if (error.request) {
        setError("Network Error: Unable to connect to the server.");
      } else {
        setError(`Error: ${error.message}`);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <h2 className="text-center mb-4">Log In</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                className="ps-3"
                type="email"
                placeholder="Enter email"
                name="email"
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group
              className="mb-3 position-relative"
              controlId="formPassword"
            >
              <Form.Label>Password</Form.Label>
              <Form.Control
                className="ps-3"
                type={isPasswordVisible ? "text" : "password"}
                placeholder="Password"
                name="password"
                onChange={handleInputChange}
              />
              <Button
                variant="primary"
                className="position-absolute end-0 bottom-0 mb-1 border-0 bg-transparent text-dark"
                onClick={togglePasswordVisibility}
              >
                {isPasswordVisible ? "HIDE" : "SHOW"}
              </Button>
            </Form.Group>

            <Button variant="primary" type="submit">
              Log in
            </Button>
          </Form>
          <Button className="btn btn-link d-block mx-auto" onClick={() => navigate(signUpURL)} style={{ backgroundColor: 'transparent' }}>
            Already have an account? Log in here
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginExistingClient;
