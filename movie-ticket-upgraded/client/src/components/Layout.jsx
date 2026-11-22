import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useLocalStorage } from '../hooks/useLocalStorage';
export default function Layout() {
  const [theme, setTheme] = useLocalStorage('cineticket_theme', 'dark');
  return <div className={`app-root theme-${theme}`}><Header theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} /><main className="page-shell"><Outlet /></main><Footer /></div>;
}
