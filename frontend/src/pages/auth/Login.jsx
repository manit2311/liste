import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api/auth';

const inputStyle = {
  width: '100%', height: '44px', border: '1.5px solid #f0dcea',
  borderRadius: '10px', background: '#fdf8fc', padding: '0 14px',
  fontSize: '14px', color: '#2c1a26', fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '12.5px', fontWeight: '600',
  color: '#7a5573', marginBottom: '6px', letterSpacing: '0.01em',
};

const errorBox = (msg) => (
  <div style={{
    background: '#fde8e8', color: '#c0392b', padding: '11px 14px',
    borderRadius: '8px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5
  }}>{msg}</div>
);

const successBox = (msg) => (
  <div style={{
    background: '#e8f8ee', color: '#1e7a45', padding: '11px 14px',
    borderRadius: '8px', marginBottom: '16px', fontSize: '13px', lineHeight: 1.5
  }}>{msg}</div>
);

function PasswordStrengthHint({ password }) {
  if (!password) return null;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasLength = password.length >= 8;

  const rules = [
    { ok: hasLength, text: "At least 8 characters" },
    { ok: hasUpper, text: "One uppercase letter (A-Z)" },
    { ok: hasLower, text: "One lowercase letter (a-z)" },
  ];

  const allOk = rules.every(r => r.ok);
  if (allOk) return null;

  return (
    <div style={{ marginTop: 8 }}>
      {rules.map((r, i) => (
        <div key={i} style={{ fontSize: 12, color: r.ok ? "#2c8a4d" : "#c0392b", marginBottom: 2 }}>
          {r.ok ? <Check size={13} /> : <X size={13} />} {r.text}
        </div>
      ))}
    </div>
  );
}

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);

  // Reset flow states
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1 = verify, 2 = new password
  const [resetUsername, setResetUsername] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [verifiedUsername, setVerifiedUsername] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');

  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(username, password);
      if (response?.success) {
        window.location.href = '/';
      } else {
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= 5) {
          setError('5 failed attempts — use "Forgot password?" below to reset your password.');
          setShowReset(true);
        } else {
          setError(`Incorrect username or password. (${newCount} of 5 attempts)`);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: verify username + phone
  const handleVerify = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetUsername.trim() || !resetPhone.trim()) {
      setResetError('Please enter both your username and phone number.');
      return;
    }
    // We call the backend with a dummy password to check if the account exists
    // Actually we just move to step 2 and let the real reset call verify
    setVerifiedUsername(resetUsername.trim());
    setVerifiedPhone(resetPhone.trim());
    setResetStep(2);
  };

  // Step 2: set new password
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetPassword) {
      setResetError('Please enter a new password.');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("Passwords don't match.");
      return;
    }

    const hasUpper = /[A-Z]/.test(resetPassword);
    const hasLower = /[a-z]/.test(resetPassword);
    if (resetPassword.length < 8 || !hasUpper || !hasLower) {
      setResetError('Password must be at least 8 characters with one uppercase and one lowercase letter.');
      return;
    }

    setResetLoading(true);
    try {
      await authAPI.resetAccount({
        username: verifiedUsername,
        phone: verifiedPhone,
        password: resetPassword,
      });
      setResetSuccess('Password updated! Sign in with your new password.');
      setFailCount(0);
      setError('');
      setTimeout(() => {
        setShowReset(false);
        setResetStep(1);
        setResetUsername(''); setResetPhone('');
        setResetPassword(''); setResetConfirm('');
        setResetSuccess('');
      }, 2500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong.';
      setResetError(msg);
      // If verification failed (wrong username/phone), go back to step 1
      if (err.response?.status === 400) {
        setResetStep(1);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openReset = () => {
    setShowReset(true);
    setResetStep(1);
    setResetError('');
    setResetSuccess('');
    setResetUsername('');
    setResetPhone('');
    setResetPassword('');
    setResetConfirm('');
  };

  const closeReset = () => {
    setShowReset(false);
    setResetStep(1);
    setResetError('');
    setResetSuccess('');
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: '#f8eff6'
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '44px 40px',
        width: '100%', maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(180,100,150,0.18)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif", fontSize: '34px',
            color: '#a82d68', marginBottom: '6px', letterSpacing: '-0.5px'
          }}>
            listé
          </div>
          <p style={{ color: '#a87c9e', fontSize: '13px', margin: 0 }}>
            Inventory Management System
          </p>
        </div>

        {!showReset ? (
          /* ── LOGIN FORM ── */
          <>
            <form onSubmit={handleLogin}>
              {error && errorBox(error)}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username</label>
                <input type="text" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your username" style={inputStyle} required />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Password</label>
                <input type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" style={inputStyle} required />
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', height: '44px',
                background: loading ? '#c4a0bc' : '#c9407f',
                color: '#fff', border: 'none', borderRadius: '22px',
                fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '0.02em',
              }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button onClick={openReset} style={{
                background: 'none', border: 'none', color: '#c9407f',
                fontSize: '13px', cursor: 'pointer', textDecoration: 'underline',
                fontFamily: "'DM Sans', sans-serif"
              }}>
                Forgot password?
              </button>
            </div>
          </>
        ) : (
          /* ── RESET FLOW ── */
          <>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[1, 2].map(s => (
                <div key={s} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: resetStep >= s ? '#c9407f' : '#f0dcea',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>

            {resetStep === 1 ? (
              /* Step 1 — verify identity */
              <form onSubmit={handleVerify}>
                <p style={{ fontSize: '13px', color: '#7a5573', marginBottom: '18px', lineHeight: 1.6 }}>
                  <strong>Step 1 of 2 — Verify your identity</strong><br />
                  Enter your username and the phone number registered on your account.
                </p>
                {resetError && errorBox(resetError)}
                {resetSuccess && successBox(resetSuccess)}
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Username</label>
                  <input type="text" value={resetUsername}
                    onChange={(e) => setResetUsername(e.target.value)}
                    placeholder="Your username" style={inputStyle} required />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={labelStyle}>Registered phone number</label>
                  <input type="text" value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="0123456789" style={inputStyle} required />
                </div>
                <button type="submit" style={{
                  width: '100%', height: '44px', background: '#c9407f',
                  color: '#fff', border: 'none', borderRadius: '22px',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  Continue →
                </button>
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <button type="button" onClick={closeReset} style={{
                    background: 'none', border: 'none', color: '#a87c9e',
                    fontSize: '12.5px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    ← Back to sign in
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2 — set new password */
              <form onSubmit={handleReset}>
                <p style={{ fontSize: '13px', color: '#7a5573', marginBottom: '18px', lineHeight: 1.6 }}>
                  <strong>Step 2 of 2 — Set new password</strong><br />
                  Choose a strong password for <strong>{verifiedUsername}</strong>.
                </p>
                {resetError && errorBox(resetError)}
                {resetSuccess && successBox(resetSuccess)}
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>New password</label>
                  <input type="password" value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Min. 8 chars, A-Z, a-z" style={inputStyle} required />
                  <PasswordStrengthHint password={resetPassword} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={labelStyle}>Confirm new password</label>
                  <input type="password" value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="Repeat the password" style={inputStyle} required />
                  {resetConfirm && resetPassword !== resetConfirm && (
                    <div style={{ fontSize: 12, color: '#c0392b', marginTop: 6 }}>
                      <X size={13} /> Passwords don't match
                    </div>
                  )}
                  {resetConfirm && resetPassword === resetConfirm && resetConfirm.length > 0 && (
                    <div style={{ fontSize: 12, color: '#2c8a4d', marginTop: 6 }}>
                      <Check size={13} /> Passwords match
                    </div>
                  )}
                </div>
                <button type="submit" disabled={resetLoading} style={{
                  width: '100%', height: '44px',
                  background: resetLoading ? '#c4a0bc' : '#c9407f',
                  color: '#fff', border: 'none', borderRadius: '22px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: resetLoading ? 'not-allowed' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {resetLoading ? 'Updating…' : 'Reset password'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '14px' }}>
                  <button type="button" onClick={() => setResetStep(1)} style={{
                    background: 'none', border: 'none', color: '#a87c9e',
                    fontSize: '12.5px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif"
                  }}>
                    ← Back
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}