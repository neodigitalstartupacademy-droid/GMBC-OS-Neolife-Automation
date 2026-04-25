import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import CatalogPage from './pages/CatalogPage';
import ProtectedRoute from './components/ProtectedRoute';

import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <NotificationProvider>
          <Layout>
            <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Layout>
      </NotificationProvider>
      </LanguageProvider>
    </Router>
  );
}
