// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// 1. Importamos tus componentes desde la carpeta pages
import Dashboard from './assets/pages/Dashboard';
import Ventas from './assets/pages/Ventas';
import Ingresos from './assets/pages/Ingresos';
import Socios from './assets/pages/Socios';
import Catalogo from './assets/pages/Catalogo';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui', backgroundColor: '#f4f6f8' }}>
        
        <nav style={{ width: '250px', backgroundColor: '#111', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h2 style={{ textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '20px', letterSpacing: '2px' }}>
            LA REINA
          </h2>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', padding: '10px' }}>📊 Dashboard</Link>
          <Link to="/ventas" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', padding: '10px' }}>🛒 Vender (Escáner)</Link>
          <Link to="/ingresos" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', padding: '10px' }}>📦 Cargar Ropa</Link>
          <Link to="/socios" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', padding: '10px' }}>👥 Caja Socios</Link>
          <Link to="/catalogo" style={{ color: 'white', textDecoration: 'none', fontSize: '18px', padding: '10px' }}>📋 Catálogo de Stock</Link>
        </nav>

        <main style={{ flex: 1, padding: '40px' }}>
          <Routes>
            {/* 2. Llamamos a los componentes de forma limpia */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/socios" element={<Socios />} />
            <Route path="/catalogo" element={<Catalogo />} />
          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;