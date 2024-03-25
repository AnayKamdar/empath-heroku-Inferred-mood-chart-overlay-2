import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import { faUser, faLock } from "@fortawesome/free-solid-svg-icons";
import blurImage from "../../Images/blur.png";
import authIcon from "../../Images/authIcon.png";
import axios from "axios";
import "./Auth.css";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showsendPasswordResetEmailModal, setShowsendPasswordResetEmailModal] = useState(false);
  const [resetEmailSend, setResetEmailSend] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      console.error("Username or password is missing.");
      return;
    }

    // let hashedPassword;
    // try {
    //   hashedPassword = await hashPassword(password);
    // } catch (err) {
    //   console.error("Error hashing the password:", err);
    //   return;
    // }

    const data = {
      email: email,
      password: password,
    };

    axios
      .post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/authenticateDashboardAccess`,
        data,
        { withCredentials: true }
      )
      .then((res) => {
        console.log(res.data);
        navigate("/Dashboard");
      })
      .catch((err) => {
        const message = err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Error during authentication";
        setErrorMessage(message);
      });
  };

  // async function hashPassword(password) {
  //   // Convert password to ArrayBuffer
  //   const encoder = new TextEncoder();
  //   const data = encoder.encode(password);

  //   // Hash the password
  //   const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  //   // Convert the hash to a hex string
  //   const hashArray = Array.from(new Uint8Array(hashBuffer));
  //   const hashHex = hashArray
  //     .map((b) => b.toString(16).padStart(2, "0"))
  //     .join("");

  //   return hashHex;
  // }

  const sendPasswordResetEmail = () => {
    setShowsendPasswordResetEmailModal(true);
  };

  const sendperformPasswordResetEmail = async () => {
    if (!email) {
      console.error("Email is missing.");
      return;
    }

    const emailData = {
      email: email,
    };

    axios
      .post(
        `${process.env.REACT_APP_BACK_END_URL}/api/passwordRecovery/sendPasswordResetEmail`,
        emailData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        console.log(res.data);
        setShowsendPasswordResetEmailModal(false);
        setResetEmailSend(true);
      })
      .catch((err) => {
        console.error("Error sending reset password email:", err);
      });
  };

  return (
    <div
      className="authContainer"
      style={{ backgroundImage: `url(${blurImage})` }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-12">
            <div className="authContent">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h1>Welcome</h1>
                  <p>We are glad to see you back with us</p>
  
                  {resetEmailSend && (
                    <div className="alert alert-success" role="alert">
                      <b>Success!</b> Reset password link sent to your email.
                    </div>
                  )}
  
                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}
  
                  <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="form-control-icon"
                      />
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        defaultValue={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faLock}
                        className="form-control-icon"
                      />
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <button className="btn next-button" 
    style={{ 
      background: '#ffffff',
      color: 'black',
      boxShadow: '7px 7px 0px rgba(0, 0, 0, 10)'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.boxShadow = '10px 10px 0px rgba(0, 0, 0, 10)'; // New boxShadow on hover
      e.currentTarget.style.background = '#e0e0e0'; // New background color on hover
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.boxShadow = '7px 7px 0px rgba(0, 0, 0, 10)'; // Revert boxShadow to original
      e.currentTarget.style.background = '#ffffff'; // Revert background color to original
    }}
    onMouseDown={(e) => {
      e.currentTarget.style.boxShadow = '3px 3px 0px rgba(0, 0, 0, 10)'; // New boxShadow when clicked
    }}
    onMouseUp={(e) => {
      e.currentTarget.style.boxShadow = '10px 10px 0px rgba(0, 0, 0, 10)'; // Revert boxShadow after click
    }}
  >Log In</button>
                    </div>
                    {/* <div className="login-divider">
                      <span>
                        <b>Login</b> with Others
                      </span>
                    </div> */}
  
                    {/* <button className="btn btn-light">
                      <FontAwesomeIcon icon={faGoogle} /> Login with <b>Google</b>
                    </button>
                    <button className="btn btn-light">
                      <FontAwesomeIcon icon={faFacebookF} /> Login with{" "}
                      <b>Facebook</b>
                    </button> */}
                    <p
                      onClick={sendPasswordResetEmail}
                      className="forgot-password-link"
                    >
                      Forgot password?
                    </p>
                    <button className="btn btn-link" onClick={() => navigate('/Register')}>
                      Don't have an account? Sign up
                    </button>
                  </form>
                </div>
  
                <div className="col-md-6">
                  <div className="imageContainer">
                    <img
                      src={authIcon}
                      alt="Illustration"
                      className="authImage"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <Modal
        show={showsendPasswordResetEmailModal}
        onHide={() => setShowsendPasswordResetEmailModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Forgot Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Please enter your email address. You will receive a link to create a
            new password via email.
          </p>
          <input
            type="email"
            className="form-control ps-3"
            placeholder="Enter your email"
            defaultValue={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowsendPasswordResetEmailModal(false)}
          >
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              sendperformPasswordResetEmail();
            }}
          >
            Send
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
  
}

export default Auth;
