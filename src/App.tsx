import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminProvider } from "@/hooks/useAdmin";
import AdminRoute from "@/components/AdminRoute";
import HomePage from "./pages/HomePage";
import QuizAttemptPage from "./pages/QuizAttemptPage";
import ResultPage from "./pages/ResultPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateQuiz from "./pages/AdminCreateQuiz";
import AdminEditQuiz from "./pages/AdminEditQuiz";
import AdminQuizAttempts from "./pages/AdminQuizAttempts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz/:quizId" element={<QuizAttemptPage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/create" element={<AdminRoute><AdminCreateQuiz /></AdminRoute>} />
            <Route path="/admin/edit/:quizId" element={<AdminRoute><AdminEditQuiz /></AdminRoute>} />
            <Route path="/admin/quiz/:quizId/attempts" element={<AdminRoute><AdminQuizAttempts /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
