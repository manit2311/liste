import React, { useState, useEffect } from 'react';
import { companyAPI } from '../../api/companies';
import { useAuthStore } from '../../store/authStore';
import { FiEye, FiEyeOff, FiShield, FiInfo } from 'react-icons/fi';

export function CompanySettings() {
  const user = useAuthStore((s) => s.user);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    try {
      const response = await companyAPI.getAll();
      const data = response.data;
      const companies = Array.isArray(data) ? data : data.results ?? [];
      // Find current user's company
      const mine = companies.find(c => c.name === user?.company_name);
      setCompany(mine || null);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const togglePrivacy = async () => {
    if (!company) return;
    setSaving(true);
    try {
      await companyAPI.update(company.id, { is_private: !company.is_private });
      setCompany({ ...company, is_private: !company.is_private });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.log(error);
      alert("Failed to update privacy setting.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <h2>Loading...</h2>;
  if (!company) return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <FiShield size={40} color="#a87c9e" />
      <h2 style={{ marginTop: 12 }}>No company found</h2>
      <p style={{ color: "#a87c9e" }}>Your account is not linked to a company.</p>
    </div>
  );

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Company Settings</h1>
          <p>Manage your company preferences and privacy.</p>
        </div>
      </div>

      {/* Company Info Card */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2c1a26", marginBottom: 16 }}>
          Company Information
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#a87c9e", marginBottom: 4, fontWeight: 500 }}>
              COMPANY NAME
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#2c1a26" }}>
              {company.name}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a87c9e", marginBottom: 4, fontWeight: 500 }}>
              SLUG
            </div>
            <div style={{ fontSize: 14, color: "#6b5b66" }}>{company.slug}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a87c9e", marginBottom: 4, fontWeight: 500 }}>
              TOTAL USERS
            </div>
            <div style={{ fontSize: 14, color: "#6b5b66" }}>{company.user_count ?? 0} users</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#a87c9e", marginBottom: 4, fontWeight: 500 }}>
              STATUS
            </div>
            <span className={`badge ${company.is_active ? "badge-pink" : "badge-blue"}`}>
              {company.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Settings Card */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#2c1a26", marginBottom: 6 }}>
          Privacy Settings
        </h3>
        <p style={{ fontSize: 13, color: "#a87c9e", marginBottom: 20, lineHeight: 1.6 }}>
          Control whether the Super Admin can view your company's detailed data.
        </p>

        {/* Privacy toggle */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", borderRadius: 12,
          border: `1.5px solid ${company.is_private ? '#fde8e8' : '#f0dcea'}`,
          background: company.is_private ? '#fff8f8' : '#fdf8fc',
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: company.is_private ? '#fde8e8' : '#fdf0f7',
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {company.is_private
                ? <FiEyeOff size={18} color="#c0392b" />
                : <FiEye size={18} color="#c9407f" />
              }
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#2c1a26" }}>
                {company.is_private ? "Data hidden from Super Admin" : "Data visible to Super Admin"}
              </div>
              <div style={{ fontSize: 12, color: "#a87c9e", marginTop: 2 }}>
                {company.is_private
                  ? "Super Admin sees a blurred placeholder instead of your data"
                  : "Super Admin can view your products, orders, and other data"
                }
              </div>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={togglePrivacy}
            disabled={saving}
            style={{
              width: 48, height: 26, borderRadius: 13, border: "none",
              background: company.is_private ? '#c0392b' : '#e0e0e0',
              cursor: saving ? 'not-allowed' : 'pointer',
              position: "relative", transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3,
              left: company.is_private ? 25 : 3,
              transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>

        {/* Info box */}
        <div style={{
          display: "flex", gap: 10, padding: "12px 16px",
          background: "#fdf8fc", borderRadius: 10,
          border: "1px solid #f0dcea",
        }}>
          <FiInfo size={16} color="#a87c9e" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: "#a87c9e", lineHeight: 1.6 }}>
            <strong>Note:</strong> Hiding your data only affects what the Super Admin sees in the platform overview.
            Your Boss and Supervisor accounts are not affected — they can still access all data normally.
            The Super Admin can still see your company name and user count.
          </div>
        </div>

        {saved && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 8,
            background: "#e8f8ee", color: "#1e7a45", fontSize: 13, fontWeight: 500,
          }}>
            ✅ Privacy setting updated successfully!
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "right" }}>
          <button
            className="btn btn-primary"
            onClick={togglePrivacy}
            disabled={saving}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {company.is_private ? <FiEyeOff size={14} /> : <FiEye size={14} />}
            {saving ? "Saving..." : company.is_private ? "Share with Super Admin" : "Hide from Super Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}