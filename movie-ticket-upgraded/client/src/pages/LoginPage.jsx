import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/api';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';
export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { await login(form.email, form.password); navigate(location.state?.from?.pathname || '/', { replace: true }); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); } };
  return <div className="container auth-container"><form className="panel auth-panel" onSubmit={submit}><span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span><h1>Đăng nhập</h1><ErrorMessage message={error}/><FormField id="email" name="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={update} required/><FormField id="password" name="password" label="Mật khẩu" type="password" autoComplete="current-password" value={form.password} onChange={update} required/><button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button><p className="form-note">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p></form></div>;
}
