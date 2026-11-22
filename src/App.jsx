import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="subject/:subjectId" element={<SubjectPage />} />
        <Route path="subject/:subjectId/lesson/:lessonId" element={<LessonPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="review" element={<ReviewPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
