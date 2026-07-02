import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import RepositoriesPage from './pages/RepositoriesPage';
import RepositoryDetailPage from './pages/RepositoryDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/repos" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/repos" element={<RepositoriesPage />} />
          <Route path="/repos/:owner/:name" element={<RepositoryDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/repos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
