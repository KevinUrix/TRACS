{/*// AppContent.jsx
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useState } from 'react'; // Importa useState

import Calendar from './components/interfaz_calendar/calendar';
import Reports from './components/interfaz_reports/reports';
import Login from './components/interfaz_login/login';
import Registro from './components/interfaz_login/registro';
import Crud from './components/interfaz_login/crud';
import AccountConfig from './components/AccountConfig';
import NavbarGlobal from './components/NavbarGlobal';

export default function AppContent() {
  const location = useLocation();
  const hideNavbarRoutes = ['/login', '/registro'];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  const [message, setMessage] = useState('');
  const [setBuildingNav, setSelectedBuildingNav] = useState('');
  const [setCycleNav, setSelectedCycleNav] = useState('');
  const [setDayNav, setSelectedDayNav] = useState('Lunes');


  return (
    <>
      <div className="bg-gray-100 flex">
        {!shouldHideNavbar && <NavbarGlobal message={message}/>}

        <div className="flex flex-col w-full">
          <Routes>
            <Route path='/' element={<Calendar setCycleNav={setSelectedCycleNav}
                setBuildingNav={setSelectedBuildingNav}
                setDayNav={setSelectedDayNav}
             />} />
            <Route path='/registro' element={<Registro />} />
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
    </>
  );
}*/}
