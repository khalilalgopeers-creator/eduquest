import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Bell, Shield, Moon, Globe, Mail, Lock, LogOut, ChevronRight, Save, Zap, FileText, HelpCircle, AlertTriangle, CheckCircle, Flame, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  onBack: () => void;
  onNavigate: (state: 'privacy' | 'terms' | 'help') => void;
  initialTab?: 'account' | 'notifications' | 'general' | 'legal';
}

const AVATAR_GRADIENTS = [
  { id: 'abyss', label: 'Neon Abyss', classes: 'from-blue-600 to-indigo-700' },
  { id: 'sunset', label: 'Sunset Blaze', classes: 'from-orange-500 to-red-600' },
  { id: 'forest', label: 'Emerald Forest', classes: 'from-emerald-500 to-teal-600' },
  { id: 'violet', label: 'Cosmic Violet', classes: 'from-indigo-500 to-purple-600' },
  { id: 'rose', label: 'Hot Pink', classes: 'from-pink-500 to-rose-600' },
  { id: 'cyberpunk', label: 'Cyberpunk', classes: 'from-purple-600 to-blue-500' }
];

const LANGUAGES = [
  { code: 'en', label: 'English (Simple & Direct)' },
  { code: 'tw', label: 'Twi (Akan Kasahorow Guide)' },
  { code: 'ew', label: 'Ewe (Standard Academic)' },
  { code: 'ga', label: 'Ga (Standard Guide)' },
  { code: 'fr', label: 'Français (Academic Level)' }
];

export default function Settings({ onBack, onNavigate, initialTab = 'general' }: SettingsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Profile data
  const [firstName, setFirstName] = useState('Khalil');
  const [lastName, setLastName] = useState('Al-Gopeers');
  const [email, setEmail] = useState('khalil.algopeers@gmail.com');
  const [phone, setPhone] = useState('+233 24 000 0000');
  const [avatarColor, setAvatarColor] = useState('from-blue-500 to-purple-600');
  const [avatarChar, setAvatarChar] = useState('K');

  // Preferences
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('English (Simple & Direct)');

  // Notification configuration
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [studyRemindersEnabled, setStudyRemindersEnabled] = useState(true);

  // Modern UI Modals
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load configuration from LocalStorage
  useEffect(() => {
    const profileSaved = localStorage.getItem('eduquest_profile');
    if (profileSaved) {
      try {
        const parsed = JSON.parse(profileSaved);
        if (parsed.firstName) setFirstName(parsed.firstName);
        if (parsed.lastName) setLastName(parsed.lastName);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.avatarColor) setAvatarColor(parsed.avatarColor);
        if (parsed.avatarChar) setAvatarChar(parsed.avatarChar);
      } catch (e) {
        console.error('Error parsing profile settings', e);
      }
    }

    const prefSaved = localStorage.getItem('eduquest_preferences');
    if (prefSaved) {
      try {
        const parsed = JSON.parse(prefSaved);
        if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
        if (parsed.language) setLanguage(parsed.language);
      } catch (e) {
        console.error('Error parsing preferences settings', e);
      }
    }

    const notifSaved = localStorage.getItem('eduquest_notifications');
    if (notifSaved) {
      try {
        const parsed = JSON.parse(notifSaved);
        if (parsed.push !== undefined) setPushEnabled(parsed.push);
        if (parsed.email !== undefined) setEmailEnabled(parsed.email);
        if (parsed.studyReminders !== undefined) setStudyRemindersEnabled(parsed.studyReminders);
      } catch (e) {
        console.error('Error parsing notifications settings', e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    // Save to LocalStorage
    localStorage.setItem('eduquest_profile', JSON.stringify({
      firstName,
      lastName,
      email,
      phone,
      avatarColor,
      avatarChar
    }));

    localStorage.setItem('eduquest_preferences', JSON.stringify({
      darkMode,
      language
    }));

    localStorage.setItem('eduquest_notifications', JSON.stringify({
      push: pushEnabled,
      email: emailEnabled,
      studyReminders: studyRemindersEnabled
    }));

    // Trigger page re-evaluate for navigation bar or general theme
    window.dispatchEvent(new Event('storage'));

    setTimeout(() => {
      setIsSaving(false);
      triggerToast('All your changes have been successfully saved!');
    }, 1000);
  };

  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 3500);
  };

  const handleResetData = () => {
    // Clear study progress list, scores, exam dates and completed topics
    localStorage.removeItem('eduquest_progress');
    localStorage.removeItem('eduquest_completed_plan_items');
    localStorage.removeItem('eduquest_exam_dates');
    localStorage.removeItem('eduquest_study_reminders');
    localStorage.removeItem('eduquest_daily_goal');
    localStorage.removeItem('eduquest_completed_topics'); // SubjectDetail topic checkings

    setShowResetModal(false);
    triggerToast('All app progress and schedules have been completely reset.');
    
    // Quick dispatch to match layout
    window.dispatchEvent(new Event('storage'));
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword.trim()) {
      setPasswordError('Please provide your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordError(null);
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    triggerToast('Password updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] bg-blue-600 border border-blue-400/50 shadow-2xl shadow-blue-500/20 px-6 py-4 rounded-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <CheckCircle size={20} className="text-white" />
            <span className="text-white font-bold text-sm tracking-wide">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-slate-400 transition-all active:scale-90">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
          <p className="text-xs text-slate-400">Configure your learning profile, custom reminders, and app preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-2">
          <TabButton 
            active={activeTab === 'general'} 
            onClick={() => setActiveTab('general')}
            icon={<Shield size={18} />}
            label="General"
          />
          <TabButton 
            active={activeTab === 'account'} 
            onClick={() => setActiveTab('account')}
            icon={<User size={18} />}
            label="Account"
          />
          <TabButton 
            active={activeTab === 'notifications'} 
            onClick={() => setActiveTab('notifications')}
            icon={<Bell size={18} />}
            label="Notifications"
          />
          <TabButton 
            active={activeTab === 'legal'} 
            onClick={() => setActiveTab('legal')}
            icon={<HelpCircle size={18} />}
            label="Legal & Help"
          />
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl"
          >
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">General Preferences</h3>
                  <div className="space-y-6">
                    <SettingToggle 
                      icon={<Moon size={20} className="text-blue-400" />}
                      title="Dark Mode"
                      description="Use immersive dark canvas theme across the application"
                      enabled={darkMode}
                      onChange={(val) => setDarkMode(val)}
                    />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                          <Globe size={20} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white">Academic Language</h4>
                          <p className="text-xs text-slate-500">Current selection: {language}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowLangModal(true)} 
                        className="text-sm font-black px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-blue-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Account Information</h3>
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className={cn(
                        "h-20 w-20 rounded-full bg-gradient-to-br border-4 border-white/10 flex items-center justify-center text-3xl font-black text-white shadow-xl transition-all",
                        avatarColor
                      )}>
                        {avatarChar}
                      </div>
                      <div className="text-center sm:text-left flex-grow">
                        <h4 className="text-lg font-bold text-white">{firstName} {lastName}</h4>
                        <p className="text-slate-400 text-sm">{email}</p>
                        <button 
                          onClick={() => setShowAvatarModal(true)} 
                          className="mt-3 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors"
                        >
                          Customize Avatar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AccountField label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                      <AccountField label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                      <AccountField label="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <AccountField label="Phone Contacts" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <Lock size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                          <span className="font-bold text-slate-300 group-hover:text-white transition-colors">Change Password</span>
                        </div>
                        <ChevronRight size={18} className="text-slate-600" />
                      </button>

                      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                            <AlertTriangle size={20} />
                          </div>
                          <div className="flex-grow">
                            <h4 className="text-md font-bold text-red-400 mb-1">Danger Zone</h4>
                            <p className="text-xs text-slate-500 mb-4">Wipe your quiz scores, completed study items, schedules, and custom syllabus data checkpoints.</p>
                            <button 
                              onClick={() => setShowResetModal(true)}
                              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/30 transition-all hover:scale-105"
                            >
                              Reset Academic Progress
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Notification Settings</h3>
                  <div className="space-y-6">
                    <SettingToggle 
                      icon={<Bell size={20} className="text-blue-400" />}
                      title="Push Notifications"
                      description="Receive real-time alerts for study times on your device"
                      enabled={pushEnabled}
                      onChange={(val) => setPushEnabled(val)}
                    />
                    <SettingToggle 
                      icon={<Mail size={20} className="text-indigo-400" />}
                      title="Email Notifications"
                      description="Weekly academic summaries and direct feedback on exam goals"
                      enabled={emailEnabled}
                      onChange={(val) => setEmailEnabled(val)}
                    />
                    <SettingToggle 
                      icon={<Zap size={20} className="text-purple-400" />}
                      title="Study Reminders"
                      description="Get quick automated reminders prior to study sessions"
                      enabled={studyRemindersEnabled}
                      onChange={(val) => setStudyRemindersEnabled(val)}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'legal' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Legal & Support</h3>
                  <div className="space-y-4">
                    <LegalLink 
                      icon={<Shield size={18} className="text-blue-400" />}
                      title="Privacy Policy"
                      description="Understand how we securely store academic stats and session preferences."
                      onClick={() => onNavigate('privacy')}
                    />
                    <LegalLink 
                      icon={<FileText size={18} className="text-indigo-400" />}
                      title="Terms of Use"
                      description="Guidelines and codes of conduct for standard and AI-powered learning paths."
                      onClick={() => onNavigate('terms')}
                    />
                    <LegalLink 
                      icon={<HelpCircle size={18} className="text-purple-400" />}
                      title="Help Center"
                      description="Common questions about BECE, WASSCE, and navigating AI instructions."
                      onClick={() => onNavigate('help')}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-white/10 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 duration-150",
                  isSaving ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                )}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* AVATAR CUSTOMIZER MODAL */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvatarModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden"
            >
              <h3 className="text-xl font-extrabold text-white mb-2">Customize Avatar</h3>
              <p className="text-xs text-slate-400 mb-6">Choose your favorite gradient and set an initial letter or emoji banner.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Initial / Symbol</label>
                  <input 
                    type="text" 
                    maxLength={2} 
                    value={avatarChar}
                    onChange={(e) => setAvatarChar(e.target.value)}
                    className="w-16 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-black uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3">Color Gradients</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVATAR_GRADIENTS.map((gradient) => (
                      <button
                        key={gradient.id}
                        onClick={() => setAvatarColor(gradient.classes)}
                        className={cn(
                          "flex items-center gap-2 p-3.5 rounded-xl border transition-all text-xs font-bold text-white relative",
                          avatarColor === gradient.classes ? "border-blue-500 bg-white/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className={cn("h-4 w-4 rounded-full bg-gradient-to-br", gradient.classes)} />
                        <span>{gradient.label}</span>
                        {avatarColor === gradient.classes && (
                          <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button 
                    onClick={() => setShowAvatarModal(false)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold transition-all hover:bg-blue-500 text-sm uppercase tracking-wider shadow-lg shadow-blue-600/20"
                  >
                    Confirm Choice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LANGUAGE SELECTOR MODAL */}
      <AnimatePresence>
        {showLangModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLangModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-extrabold text-white mb-2">Change Language</h3>
              <p className="text-xs text-slate-400 mb-6">Select your academic dialect or simple translation assistant.</p>

              <div className="space-y-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.label);
                      setShowLangModal(false);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all text-sm font-bold flex items-center justify-between",
                      language === lang.label 
                        ? "bg-blue-600/20 border-blue-500 text-white font-extrabold" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <span>{lang.label}</span>
                    {language === lang.label && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHANGE PASSWORD MODAL */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6"
            >
              <h3 className="text-xl font-extrabold text-white mb-2">Change Password</h3>
              <p className="text-xs text-slate-400 mb-6">Type a secure password of 6 characters or more.</p>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold leading-relaxed">
                    {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Current Password</label>
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors text-xs"
                  >
                    Update
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DANGER CONFIRM MODAL */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-black text-white">Reset Application Data?</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                This action is permanent and cannot be reversed. You will lose your study planner schedules, quiz ratings, daily task limits, and exam tracker timeline benchmarks.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowResetModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition-colors text-xs uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleResetData}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all text-xs uppercase tracking-wider"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SettingToggle({ icon, title, description, enabled, onChange }: { icon: React.ReactNode, title: string, description: string, enabled: boolean, onChange: (val: boolean) => void }) {
  const [isOn, setIsOn] = useState(enabled);

  useEffect(() => {
    setIsOn(enabled);
  }, [enabled]);

  const handleToggle = () => {
    const nextVal = !isOn;
    setIsOn(nextVal);
    onChange(nextVal);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="font-bold text-white text-md">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>
      <button 
        onClick={handleToggle}
        className={cn(
          "h-6 w-12 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-blue-500/30",
          isOn ? "bg-blue-600" : "bg-white/10"
        )}
      >
        <motion.div 
          animate={{ x: isOn ? 24 : 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function AccountField({ label, value, onChange }: { label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{label}</label>
      <input 
        type="text" 
        value={value}
        onChange={onChange}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
      />
    </div>
  );
}

function LegalLink({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="text-left">
          <h4 className="font-bold text-white">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-600 group-hover:text-white transition-colors" />
    </button>
  );
}
