import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// ✅ Lazy-load actual existing pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const VideoRecorder = lazy(() => import("./components/VideoRecorder"));

// ✅ Page transition animations
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
            {/* Redirect root to home */}
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* ✅ Home page with animation */}
            <Route
              path="/home"
              element={
                <motion.div
                  key="home"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Index />
                </motion.div>
              }
            />

            {/* Auth page */}
            <Route
              path="/auth"
              element={
                <motion.div
                  key="auth"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Auth />
                </motion.div>
              }
            />

            {/* Video recorder page */}
            <Route
              path="/record"
              element={
                <motion.div
                  key="record"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <VideoRecorder />
                </motion.div>
              }
            />

            {/* Catch-all Not Found */}
            <Route
              path="*"
              element={
                <motion.div
                  key="notfound"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <NotFound />
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
