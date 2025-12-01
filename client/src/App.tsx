import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AuthorityDashboard from './pages/authority/Dashboard';
import VehicleSearch from './pages/authority/VehicleSearch';
import TransferVehicle from './pages/citizen/TransferVehicle';
import VehicleHistory from './pages/citizen/VehicleHistory';
import AccountHistory from './components/AccountHistory';
import Test from './pages/Test';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transfer-vehicle" element={<TransferVehicle />} />
              <Route path="/vehicle-history" element={<VehicleHistory />} />
              <Route path="/account-history" element={<AccountHistory />} />
              <Route path="/authority" element={<AuthorityDashboard />} />
              <Route path="/authority/search" element={<VehicleSearch />} />
              <Route path="/test" element={<Test />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
