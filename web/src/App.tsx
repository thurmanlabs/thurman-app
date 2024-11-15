import React from "react"; 
import { BrowserRouter as Router, Route, Routes, BrowserRouter } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import { ThemeProvider } from "@mui/material";
import { styles } from "./styles/styles";

function App() {
  return (
      <ThemeProvider theme={styles.theme}>
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
  );
}

export default App;
