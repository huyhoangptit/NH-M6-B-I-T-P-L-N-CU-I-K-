import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiError } from '../services/api';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';
export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { register } = useAuth(); const navigate = useNavigate();
  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setError(''); setLoading(true); try { await register(form); navigate('/'); } catch (err) { setError(getApiError(err)); } finally { setLoading(false); } };
  return <div className="container auth-container"><form className="panel auth-panel" onSubmit={submit}><span className="eyebrow">TẠO TÀI KHOẢN</span><h1>Đăng ký</h1><ErrorMessage message={error}/><FormField id="name" name="name" label="Họ tên" value={form.name} onChange={update} minLength="2" required/><FormField id="email" name="email" label="Email" type="email" value={form.email} onChange={update} required/><FormField id="password" name="password" label="Mật khẩu (tối thiểu 8 ký tự)" type="password" value={form.password} onChange={update} minLength="8" required/><button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button><p className="form-note">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p></form></div>;
}
