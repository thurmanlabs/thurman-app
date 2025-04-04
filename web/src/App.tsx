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

function App() {
  return (
      <ThemeProvider theme={styles.theme}>
        <AccountProvider>
          <Router>
            <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />
            <Route path="/lend" element={<LendPage />} />
          </Routes>
        </Router>
      </AccountProvider>
      </ThemeProvider>
  );
}

export default App;
