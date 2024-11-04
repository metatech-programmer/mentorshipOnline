import React from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import User from "./pages/User";
import NotFound from "./pages/Error";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/iniciar-sesion" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route exact path="/tutorias" element={<User />} />
        <Route exact path="/administracion" element={<Admin />} />
        <Route exact path="*" element={<NotFound />} />
        <Route element={NotFound} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
