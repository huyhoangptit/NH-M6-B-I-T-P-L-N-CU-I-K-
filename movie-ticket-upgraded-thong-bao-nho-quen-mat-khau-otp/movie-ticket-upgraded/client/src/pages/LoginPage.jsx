import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, getApiError } from '../services/api';
import FormField from '../components/FormField';
import ErrorMessage from '../components/ErrorMessage';

const emptyOtp = ['', '', '', '', '', ''];

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [step, setStep] = useState('login');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(emptyOtp);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const otpRefs = useRef([]);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const update = (event) => setForm((old) => ({ ...old, [event.target.name]: event.target.value }));
  const beginForgotPassword = () => {
    setError('');
    setNotice('');
    setOtp(emptyOtp);
    setStep('email');
  };
  const backToLogin = () => {
    setStep('login');
    setError('');
    setNotice('');
    setOtp(emptyOtp);
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/request-otp', { email: form.email });
      setOtp(emptyOtp);
      setStep('otp');
      setNotice('Nếu email đã được đăng ký, mã OTP gồm 6 chữ số sẽ được gửi đến hộp thư của bạn. Mã có hiệu lực trong 10 phút.');
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const updateOtpDigit = (index, rawValue) => {
    const digits = String(rawValue).replace(/\D/g, '').slice(0, 6 - index).split('');
    if (!digits.length) {
      setOtp((old) => old.map((value, i) => (i === index ? '' : value)));
      return;
    }
    setOtp((old) => old.map((value, i) => (i >= index && i < index + digits.length ? digits[i - index] : value)));
    const nextIndex = Math.min(index + digits.length, 5);
    otpRefs.current[nextIndex]?.focus();
  }


  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    event.preventDefault();
    setOtp([...digits, ...emptyOtp].slice(0, 6));
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    const code = otp.join('');
    if (!/^\d{6}$/.test(code)) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password/verify-otp', { email: form.email, otp: code });
      setResetToken(response.data.data.resetToken);
      setStep('reset');
      setNotice('Mã OTP chính xác. Hãy tạo mật khẩu mới cho tài khoản của bạn.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/reset-password', {
        email: form.email,
        resetToken,
        newPassword
      });
      setForm((old) => ({ ...old, password: '' }));
      setOtp(emptyOtp);
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setStep('login');
      setNotice('Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container auth-container">
      <section className="panel auth-panel auth-panel-forgot">
        {step === 'login' && (
          <form onSubmit={submitLogin}>
            <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
            <h1>Đăng nhập</h1>
            <ErrorMessage message={error} />
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            <FormField id="email" name="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={update} required />
            <FormField id="password" name="password" label="Mật khẩu" type="password" autoComplete="current-password" value={form.password} onChange={update} required />
            <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
            <div className="auth-help-row"><button type="button" className="text-button" onClick={beginForgotPassword}>Quên mật khẩu?</button></div>
            <p className="form-note">Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
          </form>
        )}

        {step === 'email' && (
          <form onSubmit={requestOtp}>
            <span className="eyebrow">KHÔI PHỤC TÀI KHOẢN</span>
            <h1>Quên mật khẩu?</h1>
            <p className="auth-step-description">Nhập email bạn đã sử dụng để đăng ký và đăng nhập. HTH sẽ gửi mã OTP đến email này.</p>
            <ErrorMessage message={error} />
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            <FormField id="forgot-email" name="email" label="Email đã đăng ký" type="email" autoComplete="email" value={form.email} onChange={update} required />
            <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang gửi mã...' : 'Gửi mã OTP đến email'}</button>
            <p className="form-note"><button type="button" className="text-button" onClick={backToLogin}>← Quay lại đăng nhập</button></p>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={verifyOtp}>
            <span className="eyebrow">XÁC THỰC EMAIL</span>
            <h1>Nhập mã OTP</h1>
            <p className="auth-step-description">Nhập 6 chữ số được gửi đến <b>{form.email}</b>. Vui lòng kiểm tra cả thư mục Spam/Thư rác.</p>
            <ErrorMessage message={error} />
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            <div className="otp-input-row" aria-label="Mã OTP gồm 6 chữ số">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpRefs.current[index] = element; }}
                  className="otp-digit-input"
                  aria-label={`Chữ số OTP thứ ${index + 1}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtpDigit(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  required
                />
              ))}
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}</button>
            <p className="form-note"><button type="button" className="text-button" onClick={() => { setStep('email'); setError(''); setNotice(''); }}>Đổi địa chỉ email</button></p>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetPassword}>
            <span className="eyebrow">BẢO MẬT TÀI KHOẢN</span>
            <h1>Tạo mật khẩu mới</h1>
            <p className="auth-step-description">Email đã xác thực: <b>{form.email}</b>. Mật khẩu mới cần có ít nhất 8 ký tự.</p>
            <ErrorMessage message={error} />
            {notice && <div className="alert alert-success" role="status">{notice}</div>}
            <FormField id="new-password" label="Mật khẩu mới" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <FormField id="confirm-password" label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            <button className="btn btn-primary btn-block" disabled={loading}>{loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</button>
            <p className="form-note"><button type="button" className="text-button" onClick={backToLogin}>← Quay lại đăng nhập</button></p>
          </form>
        )}
      </section>
    </div>
  );
}
