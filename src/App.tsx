import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ✅ Simple animation variants for page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading...</div>}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="/dashboard"
              element={
                <motion.div
                  key="dashboard"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <DashboardPage />
                </motion.div>
              }
            />
            <Route
              path="/settings"
              element={
                <motion.div
                  key="settings"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <SettingsPage />
                </motion.div>
              }
            />
            <Route
              path="*"
              element={
                <motion.div
                  key="notfound"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <NotFoundPage />
                </motion.div>
              }
            />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Router>
  );
}

export default App;
