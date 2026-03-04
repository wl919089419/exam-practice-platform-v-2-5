import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ExamList from './pages/ExamList';
import ExamPractice from './pages/ExamPractice';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exams" element={<ExamList />} />
          <Route path="/practice/:category/:subject/:level" element={<ExamPractice />} />
          <Route path="/practice/file/:filename" element={<ExamPractice />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
