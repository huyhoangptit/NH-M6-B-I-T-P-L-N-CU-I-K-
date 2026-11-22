import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import BookingPage from './pages/BookingPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HistoryPage from './pages/HistoryPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminMoviesPage from './pages/AdminMoviesPage';
import AdminRoomsPage from './pages/AdminRoomsPage';
import AdminShowtimesPage from './pages/AdminShowtimesPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="movies/:id" element={<MovieDetailPage />} />
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="booking/:showtimeId" element={<BookingPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="history" element={<HistoryPage />} />
    </Route>
    <Route element={<ProtectedRoute adminOnly />}>
      <Route path="admin" element={<AdminDashboardPage />} />
      <Route path="admin/movies" element={<AdminMoviesPage />} />
      <Route path="admin/rooms" element={<AdminRoomsPage />} />
      <Route path="admin/showtimes" element={<AdminShowtimesPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes>;
}
