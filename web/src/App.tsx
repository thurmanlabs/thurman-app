import React from "react"; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import AccountProvider from "./providers/AccountProvider";
import Header from "./components/Header";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import { ThemeProvider } from "@mui/material";
import { styles } from "./styles/styles";

import Pools from "./pages/Pools";
import PoolDetails from "./pages/PoolDetails";
import LoanPoolCreator from "./components/loan-pool/LoanPoolCreator";
import MyLoanPools from "./components/loan-pool/MyLoanPools";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
      <ThemeProvider theme={styles.theme}>
        <SnackbarProvider 
          maxSnack={3}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={4000}
        >
          <Router>
            <AccountProvider>
              <Header />
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<LogIn />} />

              <Route path="/pools" element={<Pools />} />
              <Route path="/pools/:id" element={<PoolDetails />} />
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
        </SnackbarProvider>
      </ThemeProvider>
  );
}

export default App;
