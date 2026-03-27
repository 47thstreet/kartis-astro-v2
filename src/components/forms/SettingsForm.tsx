'use client';

import { useState } from 'react';
import { validateSettings, type FieldError } from '../../lib/validate';

type Props = {
  name: string;
  email: string;
  role: string;
};

export default function SettingsForm({ name: initialName, email, role }: Props) {
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);

  const fieldError = (field: string) => fieldErrors.find(e => e.field === field)?.message;
  const clearFieldError = (field: string) => setFieldErrors(f => f.filter(x => x.field !== field));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const errors = validateSettings(name, currentPassword, newPassword);
    setFieldErrors(errors);
    if (errors.length > 0) return;

    setSaving(true);

    const body: any = {};
    if (name !== initialName) body.name = name;
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    if (Object.keys(body).length === 0) {
      setMessage({ text: 'No changes to save', ok: false });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setMessage({ text: 'Settings saved', ok: true });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ text: err.message, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full h-10 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors';
  const labelClass = 'block text-[12px] font-semibold text-white/40 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div className={`rounded-xl border p-3 text-sm ${message.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-red-500/20 bg-red-500/10 text-red-300'}`}>
          {message.text}
        </div>
      )}

      {/* Profile */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input value={name} onChange={(e) => { setName(e.target.value); clearFieldError('name'); }} className={`${inputClass} ${fieldError('name') ? 'border-red-500/40' : ''}`} />
          {fieldError('name') && <p className="text-[11px] text-red-400/80 mt-1">{fieldError('name')}</p>}
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input value={email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
          <p className="text-[11px] text-white/20 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label className={labelClass}>Role</label>
          <input value={role} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/20">Change Password</p>
        <div>
          <label className={labelClass}>Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); clearFieldError('currentPassword'); }} placeholder="Enter current password" className={`${inputClass} ${fieldError('currentPassword') ? 'border-red-500/40' : ''}`} />
          {fieldError('currentPassword') && <p className="text-[11px] text-red-400/80 mt-1">{fieldError('currentPassword')}</p>}
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); clearFieldError('newPassword'); }} placeholder="Min 8 characters" className={`${inputClass} ${fieldError('newPassword') ? 'border-red-500/40' : ''}`} />
          {fieldError('newPassword') && <p className="text-[11px] text-red-400/80 mt-1">{fieldError('newPassword')}</p>}
          <p className="text-[11px] text-white/15 mt-1">Must be at least 8 characters</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="h-11 w-full rounded-xl bg-violet-600 font-semibold text-white hover:bg-violet-500 disabled:opacity-60 transition-colors"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}
