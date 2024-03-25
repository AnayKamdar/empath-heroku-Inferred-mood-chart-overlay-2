import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faLock, faEnvelope, faCakeCandles, faKey, faEye, faEyeSlash, faX, faCheck } from "@fortawesome/free-solid-svg-icons";
import blurImage from "../../Images/blur.png";
import authIcon from "../../Images/authIcon.png";
import axios from "axios";
import StripePricingTable from '../Dashboard/StripePricingTable';
import "./Register.css";



function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [isAccessKeyValidated, setIsAccessKeyValidated] = useState("default");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(false);
  const navigate = useNavigate();


  const handleRegister = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      console.error("Name, Username or Password is missing.");
      return;
    }

    const data = {
        name: name,
        email: email,
        password: password,
    };

    try {
      const userResponse = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/users/registerNewUser`,
        data,
        { withCredentials: true }
      );
  
      const userId = userResponse.data.userId;

      const therapistData = {
        user_id: userId,
        prompt: "",
      };
      await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/registerTherapists`,
        therapistData,
        { withCredentials: true }
      );
  
      navigate('/');
    } catch (error) {
      console.error("Error during registration or adding therapist:", error);
    }
  };

  const validateAccessKey = async (e) => {
    e.preventDefault();
  
    if (!accessKey) {
      console.error("Access Key is missing.");
      return;
    }
  
    try {
      setIsAccessKeyValidated('validating');
  
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_END_URL}/api/therapists/validateAccessKey`,
        { accessKey: accessKey },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        setIsAccessKeyValidated('valid');
      } else {
        setIsAccessKeyValidated('invalid');
      }
  
      console.log(response.data.message);
    } catch (error) {
      console.error("Error validating Access Key:", error);
      setIsAccessKeyValidated('invalid');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const togglePasswordConfirmVisibility = () => {
    setIsPasswordConfirmVisible(!isPasswordConfirmVisible);
  };
  const handleConfirmPassword = () => {
    setPasswordMatch(password === passwordConfirm);
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
                  <h1>Create an Account</h1>
                  <p>Sign up to get started!</p>
                  <form onSubmit={handleRegister}>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faUser}
                        className="form-control-icon form-control-register-icon"
                      />
                      <input
                        type="name"
                        className="form-control"
                        placeholder="Full Name"
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    {/* <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faCakeCandles}
                        className="form-control-icon"
                      />
                      <input
                        type="age"
                        className="form-control"
                        placeholder="Age"
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div> */}
                    <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="form-control-icon"
                      />
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon 
                        icon={faLock}
                        className="form-control-icon"
                      />
                      <div className="password-input">
                        <input
                          type={isPasswordVisible ? 'text' : 'password'}
                          className="form-control"
                          placeholder="Password"
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="password-toggle-button"
                          onClick={togglePasswordVisibility}
                        >
                          <FontAwesomeIcon icon={isPasswordVisible ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon 
                        icon={passwordConfirm == '' ? faLock : passwordMatch ? faCheck : faLock}
                        className="form-control-icon"
                      />
                      <div className="password-input">
                        <input
                          type={isPasswordConfirmVisible ? 'text' : 'password'}
                          className={`password-input ${passwordConfirm !== '' ? passwordMatch ? 'validMatch': 'invalidMatch' : 'form-control'}`}
                          placeholder="Confirm Password"
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          onBlur={handleConfirmPassword}
                        />
                        <button
                          type="button"
                          className="password-toggle-button"
                          onClick={togglePasswordConfirmVisibility}
                        >
                          <FontAwesomeIcon icon={isPasswordConfirmVisible ? faEyeSlash : faEye} />
                        </button>
                      </div>
                    </div>
                    <div className="form-group mb-3">
                      <FontAwesomeIcon
                        icon={faKey}
                        className="form-control-icon"
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Access key emailed upon starting your subscription
                      "
                        onChange={(e) => setAccessKey(e.target.value)}
                      />
                      <button
                        className={`btn btn-secondary validate-button ${
                          isAccessKeyValidated === 'valid' ? 'validated' : isAccessKeyValidated === 'invalid' ? 'invalid' : ''
                        }`}
                        disabled={(isAccessKeyValidated === 'valid')}
                        onClick={validateAccessKey}
                      >
                        {isAccessKeyValidated === 'valid' ? 'Validated' : isAccessKeyValidated === 'invalid' ? 'Try Again' : 'Validate'}
                      </button>
                    </div>
                    <div className="form-group mb-3">
                      <button className="btn next-button" disabled={!(isAccessKeyValidated === 'valid' && passwordMatch)}>REGISTER</button>
                    </div>
                    <button className="btn btn-link" onClick={() => navigate('/')}>
                      Already have an account? Sign in
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
  </div>
);
}

export default Register;