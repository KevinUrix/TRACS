import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Calendar from './components/interfaz_calendar/calendar';  // Importamos Calendar
import Reports from './components/interfaz_reports/reports';    // Importamos Reports
import Login from './components/interfaz_login/login';
import Registro from './components/interfaz_login/registro';
import Crud from './components/interfaz_login/crud';
import AccountConfig from './components/AccountConfig';

export default function App() {

  return (
    <>
    <head>
    </head>
    <Router>
      <div className="bg-gray-100 flex">

        {/* Contenido principal */}
        <div className="flex flex-col w-full">
          {/* Rutas */}
          <Routes>
            <Route path='/' element={<Calendar />} />
            <Route path='/registro' element={<Registro />}/>
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/reportes" element={<Reports />} />
            <Route path='/crud' element={<Crud />} />
            <Route path="/login" element={<Login />} />
            <Route path="/configuracion" element={<AccountConfig />} />

          </Routes>
        </div>
      </div>
      <ToastContainer
          position="top-right"
          autoClose={2600}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
    </Router>
  </>
  );
}
