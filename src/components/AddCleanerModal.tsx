import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  Copy,
  Share2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Warehouse
} from 'lucide-react';
import { User as UserType } from '../types';

const PRESET_CLEANER_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=300',
];

const compressAvatar = (base64Str: string, maxDim = 400, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface AddCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingUsers: UserType[];
  onAddCleaner: (cleanerData: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
  }) => Promise<UserType>;
}

export default function AddCleanerModal({
  isOpen,
  onClose,
  existingUsers,
  onAddCleaner
}: AddCleanerModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  
  // Avatar selection
  const [avatarTab, setAvatarTab] = useState<'PRESET' | 'UPLOAD' | 'URL'>('PRESET');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_CLEANER_AVATARS[0]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [registeredUser, setRegisteredUser] = useState<{
    user: UserType;
    rawPassword: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const generateRandomPassword = () => {
    const prefixes = ['Petugas', 'Gudang', 'Japfa', 'Bersih'];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const symbols = ['@', '#', '$', '!'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const newPass = `${randomPrefix}${randomSymbol}${randomNum}`;
    setPassword(newPass);
    setFormError('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('File harus berupa format gambar (JPEG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Ukuran file foto terlalu besar (maksimal 5MB).');
      return;
    }

    setFormError('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressAvatar(reader.result as string);
        setSelectedAvatar(compressed);
      } catch {
        setSelectedAvatar(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanName) {
      setFormError('Nama lengkap petugas wajib diisi.');
      return;
    }

    if (!cleanEmail) {
      setFormError('Alamat email login wajib diisi.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('Format alamat email tidak valid.');
      return;
    }

    if (cleanPassword.length < 4) {
      setFormError('Kata sandi minimal 4 karakter.');
      return;
    }

    // Check if email already exists
    const duplicate = existingUsers.some(
      (u) => u.email.trim().toLowerCase() === cleanEmail && u.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      setFormError(`Petugas dengan nama "${cleanName}" dan email "${cleanEmail}" sudah terdaftar.`);
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const finalAvatar = avatarTab === 'URL' && customUrlInput.trim() ? customUrlInput.trim() : selectedAvatar;
      const created = await onAddCleaner({
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        avatarUrl: finalAvatar
      });

      setRegisteredUser({
        user: created,
        rawPassword: cleanPassword
      });
    } catch (err: any) {
      console.error('Error adding cleaner:', err);
      setFormError(err?.message || 'Gagal menambahkan petugas. Silakan periksa koneksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!registeredUser) return;
    const text = `📋 *AKUN LOGIN PETUGAS GUDANGCLEAN*\n\n` +
      `👤 *Nama*: ${registeredUser.user.name}\n` +
      `🔑 *Peran*: Petugas Kebersihan\n` +
      `📧 *Email Login*: ${registeredUser.user.email}\n` +
      `🔒 *Kata Sandi*: ${registeredUser.rawPassword}\n\n` +
      `🌐 *Akses Aplikasi*: ${window.location.origin}\n` +
      `_Simpan dan gunakan data ini untuk melakukan absensi dan laporan harian kebersihan._`;

    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleShareWhatsApp = () => {
    if (!registeredUser) return;
    const text = `📋 *AKUN LOGIN PETUGAS GUDANGCLEAN*\n\n` +
      `Halo *${registeredUser.user.name}*,\nBerikut adalah akun Anda untuk aplikasi GudangClean:\n\n` +
      `👤 *Nama*: ${registeredUser.user.name}\n` +
      `🔑 *Peran*: Petugas Kebersihan\n` +
      `📧 *Email Login*: ${registeredUser.user.email}\n` +
      `🔒 *Kata Sandi*: ${registeredUser.rawPassword}\n\n` +
      `🌐 *Akses Aplikasi*: ${window.location.origin}\n\n` +
      `Silakan masuk dan lakukan presensi sebelum mulai bertugas. Terima kasih!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPassword('password123');
    setSelectedAvatar(PRESET_CLEANER_AVATARS[0]);
    setCustomUrlInput('');
    setFormError('');
    setRegisteredUser(null);
    setCopiedCredentials(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6 relative"
          id="add-cleaner-modal"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-zinc-850 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white font-display">
                  {registeredUser ? 'Petugas Berhasil Didaftarkan' : 'Daftarkan Petugas Kebersihan'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {registeredUser
                    ? 'Bagikan informasi akun login berikut kepada petugas.'
                    : 'Buat akun baru agar petugas dapat langsung login ke aplikasi.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                handleResetForm();
                onClose();
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-850 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {registeredUser ? (
              /* SUCCESS STATE WITH CREDENTIALS SHARING */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400">Akun Siap Digunakan!</h4>
                    <p className="text-xs text-emerald-300/80 mt-0.5">
                      Petugas {registeredUser.user.name} sekarang dapat login menggunakan kredensial di bawah ini.
                    </p>
                  </div>
                </div>

                {/* Profile Card Summary */}
                <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={registeredUser.user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt={registeredUser.user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-base font-extrabold text-white font-display">
                        {registeredUser.user.name}
                      </h4>
                      <span className="text-xs text-emerald-400 font-semibold inline-flex items-center space-x-1">
                        <span>● Petugas Kebersihan</span>
                      </span>
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-850">
                      <span className="text-zinc-500">Email Login:</span>
                      <span className="font-bold text-white select-all">{registeredUser.user.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Kata Sandi:</span>
                      <span className="font-bold text-emerald-400 select-all tracking-wider">{registeredUser.rawPassword}</span>
                    </div>
                  </div>
                </div>

                {/* Sharing & Copy Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      copiedCredentials
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-850 hover:bg-zinc-800 text-white border border-zinc-750'
                    }`}
                  >
                    {copiedCredentials ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Data Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Kredensial Akun</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-950"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Kirim via WhatsApp</span>
                  </button>
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-zinc-850 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    + Daftarkan Petugas Lainnya
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetForm();
                      onClose();
                    }}
                    className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-medium flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Nama Lengkap Petugas <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Contoh: Ahmad Supriyadi"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFormError('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Alamat Email Login <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="Contoh: ahmad@gmail.com atau petugas.ahmad@gudang.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFormError('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block">
                    Email ini akan digunakan oleh petugas untuk masuk ke aplikasi.
                  </span>
                </div>

                {/* Password Input with Generator */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Kata Sandi Login <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Buat kata sandi acak yang aman"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Sandi Acak</span>
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 4 karakter"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFormError('');
                      }}
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 outline-none transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Avatar Selection Section */}
                <div className="space-y-2 pt-2 border-t border-zinc-850">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    Foto Profil Petugas
                  </label>

                  <div className="flex items-center space-x-4">
                    {/* Live Avatar Preview */}
                    <div className="relative shrink-0">
                      <img
                        src={avatarTab === 'URL' && customUrlInput ? customUrlInput : selectedAvatar}
                        alt="Preview Avatar"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md bg-zinc-900"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex-1 space-y-2">
                      <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-850">
                        <button
                          type="button"
                          onClick={() => setAvatarTab('PRESET')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            avatarTab === 'PRESET'
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Pilihan Preset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab('UPLOAD')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            avatarTab === 'UPLOAD'
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload Foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAvatarTab('URL')}
                          className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                            avatarTab === 'URL'
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span>Link URL</span>
                        </button>
                      </div>

                      {/* Tab: Presets */}
                      {avatarTab === 'PRESET' && (
                        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-thin">
                          {PRESET_CLEANER_AVATARS.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedAvatar(url)}
                              className={`relative rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                selectedAvatar === url ? 'border-emerald-500 scale-105 shadow-md' : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={url}
                                alt={`Preset ${idx + 1}`}
                                className="w-8 h-8 object-cover"
                                referrerPolicy="no-referrer"
                              />
                              {selectedAvatar === url && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-emerald-300" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tab: Upload */}
                      {avatarTab === 'UPLOAD' && (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pilih Foto dari Galeri / Kamera</span>
                          </button>
                        </div>
                      )}

                      {/* Tab: URL */}
                      {avatarTab === 'URL' && (
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={customUrlInput}
                          onChange={(e) => setCustomUrlInput(e.target.value)}
                          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-xl text-xs text-zinc-300 placeholder-zinc-700 outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-zinc-850 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mendaftarkan...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Daftarkan Petugas</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
