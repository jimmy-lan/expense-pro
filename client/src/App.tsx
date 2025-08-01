import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { HomePage, LoginPage, SignupPage } from "./pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </Router>
  );
}

export default App;
