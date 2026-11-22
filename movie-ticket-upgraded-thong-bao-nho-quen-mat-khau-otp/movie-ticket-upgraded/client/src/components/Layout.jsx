import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ToastViewport from './ToastViewport';

export default function Layout() {
  const { pathname } = useLocation();
  const isBookingFlow = /^\/movies\/[^/]+$/.test(pathname)
    || pathname.startsWith('/booking/')
    || pathname === '/checkout';

  return (
    <div className="app-root theme-dark">
      {!isBookingFlow && <Header />}
      <main className={`page-shell ${isBookingFlow ? 'page-shell-flow' : ''}`}><Outlet /></main>
      {!isBookingFlow && <Footer />}
      <ToastViewport />
    </div>
  );
}
