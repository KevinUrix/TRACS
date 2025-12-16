import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './AppContent'; // separado en otro componente

export default function App() {
  return (
    <>
      <Router>
        <AppContent />
      </Router>
    </>
  );
}
