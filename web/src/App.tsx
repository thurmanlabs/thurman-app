import React from "react"; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import AccountProvider from "./providers/AccountProvider";
import Header from "./components/Header";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import { ThemeProvider } from "@mui/material";
import { styles } from "./styles/styles";
import LendPage from "./pages/LendPage";
import LoanPoolCreator from "./components/loan-pool/LoanPoolCreator";
import MyLoanPools from "./components/loan-pool/MyLoanPools";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
      <ThemeProvider theme={styles.theme}>
        <Router>
          <AccountProvider>
            <Header />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />
              <Route path="/lend" element={<LendPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/create-pool" 
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <LoanPoolCreator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage/my-loan-pools" 
                element={
                  <ProtectedRoute>
                    <MyLoanPools />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/manage/create-loan-pool" 
                element={
                  <ProtectedRoute>
                    <LoanPoolCreator />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AccountProvider>
        </Router>
      </ThemeProvider>
  );
}

export default App;
