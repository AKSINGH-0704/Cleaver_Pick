import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import AppShell from './components/layout/AppShell';
import Toast from './components/Toast';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import DashboardPage from './pages/DashboardPage';
import BenchmarkPage from './pages/BenchmarkPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { AppProvider } from './context/AppContext';
import { useToast } from './hooks/useToast';

// Spring-based page transition — no linear or easeInOut
const pageVariants = {
  initial: { opacity: 0, y: 14, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.998 },
};

const pageTransition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

function AnimatedRoutes() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isChat = location.pathname === '/chat';

  return (
    <AppShell particles={isLanding || isChat} radial="violet" grid>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/benchmark" element={<BenchmarkPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}

function AppContent() {
  const { toasts, removeToast } = useToast();
  return (
    <>
      <Navbar />
      <main>
        <AnimatedRoutes />
      </main>
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
