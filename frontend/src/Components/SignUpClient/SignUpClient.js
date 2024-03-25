import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Alert, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

const SignUpClient = () => {
  const { signUpCode, token } = useParams();
  const loginURL = `/login-existing-client/${signUpCode}/${token}`;
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    age: "",
    password: "",
    profilePicture: "",
    userInfo: "",
  });
  const [error, setError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("userData", userData);

      if (
        !userData.name ||
        !userData.email ||
        !userData.password ||
        !passwordConfirm
      ) {
        setError("Please fill in all fields.");
        return;
      }

      if (userData.password !== passwordConfirm) {
        setError("Passwords do not match");
        return;
      }

      const res = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/registerNewUserForClients`,
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
        `${process.env.REACT_APP_BACK_END_URL}/api/clients/associateClientWithTherapist`,
        { userId, therapistId },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      navigate("/success?existing=false");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          setError(
            "Unauthorized: Please use the email to which this invite was sent. (401)"
          );
        } else if (status === 404) {
          setError("Not Found: The requested resource was not found. (404)");
        } else if (status === 409) {
          setError(
            "This email is already in use. Please use a different email or log in instead. (409)"
          );
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
  const togglePasswordConfirmVisibility = () => {
    setIsPasswordConfirmVisible(!isPasswordConfirmVisible);
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <h2 className="text-center mb-4">Sign Up</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                className="ps-3"
                type="text"
                placeholder="Enter name"
                name="name"
                onChange={handleInputChange}
              />
            </Form.Group>

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

            {/* <Form.Group className="mb-3" controlId="formAge">
              <Form.Label>Age</Form.Label>
              <Form.Control className="ps-3" type="number" placeholder="Age" name="age" onChange={handleInputChange} />
            </Form.Group> */}

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

            <Form.Group
              className="mb-3 position-relative"
              controlId="formPassword"
            >
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                className="ps-3"
                type={isPasswordConfirmVisible ? "text" : "password"}
                placeholder="Confirm Password"
                name="confirmpassword"
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <Button
                variant="primary"
                className="position-absolute end-0 bottom-0 mb-1 border-0 bg-transparent text-dark"
                onClick={togglePasswordConfirmVisibility}
              >
                {isPasswordConfirmVisible ? "HIDE" : "SHOW"}
              </Button>
            </Form.Group>

            <Button variant="primary" type="submit">
              Sign Up
            </Button>
          </Form>
          <Button className="btn btn-link d-block mx-auto" onClick={() => navigate(loginURL)} style={{ backgroundColor: 'transparent' }}>
            Already have an account? Log in here
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default SignUpClient;
