import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './AppContent'; // separado en otro componente
import BASENAME from './config/baseName';

export default function App() {
  return (
    <>
      <Router basename={BASENAME}>
        <AppContent />
      </Router>
    </>
  );
}
