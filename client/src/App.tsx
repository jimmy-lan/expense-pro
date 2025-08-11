import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  HomePage,
  SigninPage,
  SignupPage,
  MySpacesPage,
  SignoutConfirmPage,
  NewSpacePage,
} from "./pages";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/my" element={<MySpacesPage />} />
        <Route path="/spaces/new" element={<NewSpacePage />} />
        <Route path="/logout/confirm" element={<SignoutConfirmPage />} />
      </Routes>
    </Router>
  );
}

export default App;
