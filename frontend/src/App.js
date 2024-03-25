import React from 'react';
import Auth from './Components/Auth/Auth';
import AdminDash from './Components/Dashboard/Dashboard';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './Components/Register/Register';
import PerformPasswordReset from './Components/performPasswordReset/PerformPasswordReset';
import SignUpClient from './Components/SignUpClient/SignUpClient';
import Success from './Components/SignUpClient/Success';
import LoginExistingClient from './Components/SignUpClient/LoginExistingClient';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/Dashboard" element={<AdminDash />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/reset-password/:userId/:token" element={<PerformPasswordReset />} />
        <Route path="/sign-up-client/:signUpCode/:token" element={<SignUpClient />} />
        <Route path="/success" element={<Success/>} />
        <Route path="/login-existing-client/:signUpCode/:token" element={<LoginExistingClient />} />
      </Routes>
    </Router>
  );
}

export default App;
