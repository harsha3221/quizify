import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuthSkeleton from "./components/AuthSkeleton";

/* PAGES */
import AuthForm from "./pages/login.jsx";
import Home from "./pages/home.jsx";
import TeacherMonitoring from "./pages/TeacherMonitoring.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import AvailableCourses from "./pages/AvailableCourses.jsx";
import QuizList from "./pages/QuizList.jsx";
import CreateQuiz from "./pages/CreateQuiz.jsx";
import QuizQuestions from "./pages/QuizQuestions.jsx";
import StudentSubjectQuizzes from "./pages/StudentSubjectQuizzes.jsx";
import StudentStartQuiz from "./pages/StudentStartQuiz.jsx";
import StudentSubmitted from "./pages/StudentSubmitted.jsx";
import TeacherQuizResults from "./pages/TeacherQuizResults.jsx";
import StudentQuizResult from "./pages/StudentQuizResult.jsx";
import QuizAIInsights from "./pages/QuizAIInsights.jsx"; // Adjust path as needed
import VerifyEmail from "./pages/VerifyEmail";
import VerificationSuccess from "./pages/VerificationSuccess.jsx";
import VerifyEmailRequired from "./pages/verifyEmailRequired.jsx";
import VerificationFailed from "./pages/VerificationFailed.jsx";

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <AuthSkeleton />;
  }

  return (
    <Routes>

      {/* =========================
         PUBLIC ROUTES
      ========================= */}

      {/* ✅ HOME PAGE */}
      <Route path="/" element={<Home />} />

      {/* ✅ LOGIN / SIGNUP */}
      <Route path="/login" element={<AuthForm />} />

      {/* EMAIL VERIFICATION */}
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/verify-email" element={<VerifyEmailRequired />} />
      <Route path="/verification-success" element={<VerificationSuccess />} />
      <Route path="/verification-failed" element={<VerificationFailed />} />



      {/* =========================
         TEACHER ROUTES
      ========================= */}

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute role="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/monitoring/:quizId"
        element={
          <ProtectedRoute role="teacher">
            <TeacherMonitoring />
          </ProtectedRoute>
        }
      />
      {/* ✅ AI ANALYSIS REPORT */}
      <Route
        path="/teacher/quiz/:quizId/analysis"
        element={
          <ProtectedRoute role="teacher">
            {/* If you want it to look like a full page, wrap it in a div or a Page layout */}
            <div className="p-6">
              <QuizAIInsights />
            </div>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/subjects/:subjectId/quizzes"
        element={
          <ProtectedRoute role="teacher">
            <QuizList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/subjects/:subjectId/quizzes/new"
        element={
          <ProtectedRoute role="teacher">
            <CreateQuiz />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/quiz/:quizId/questions"
        element={
          <ProtectedRoute role="teacher">
            <QuizQuestions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/quiz/:quizId/results"
        element={
          <ProtectedRoute role="teacher">
            <TeacherQuizResults />
          </ProtectedRoute>
        }
      />



      {/* =========================
         STUDENT ROUTES
      ========================= */}

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/available-courses"
        element={
          <ProtectedRoute role="student">
            <AvailableCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/subject/:subjectId/quizzes"
        element={
          <ProtectedRoute role="student">
            <StudentSubjectQuizzes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/quiz/:quizId/start"
        element={
          <ProtectedRoute role="student">
            <StudentStartQuiz />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/quiz/:quizId/submitted"
        element={
          <ProtectedRoute role="student">
            <StudentSubmitted />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/quiz/:quizId/result"
        element={
          <ProtectedRoute role="student">
            <StudentQuizResult />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;