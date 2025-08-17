import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  HomePage,
  SigninPage,
  SignupPage,
  MySpacesPage,
  SignoutConfirmPage,
  NewSpacePage,
  DeleteSpacesPage,
  NewTransactionPage,
  DeleteTransactionPage,
} from "./pages";
import { SpacePage } from "./pages/spaces/SpacePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<SigninPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/my" element={<MySpacesPage />} />
        <Route path="/my/space/:spaceId" element={<SpacePage />} />
        <Route
          path="/my/space/:spaceId/transactions/new"
          element={<NewTransactionPage />}
        />
        <Route
          path="/my/space/:spaceId/transactions/:transactionId/delete"
          element={<DeleteTransactionPage />}
        />
        <Route path="/spaces/new" element={<NewSpacePage />} />
        <Route path="/spaces/delete" element={<DeleteSpacesPage />} />
        <Route path="/logout/confirm" element={<SignoutConfirmPage />} />
      </Routes>
    </Router>
  );
}

export default App;
