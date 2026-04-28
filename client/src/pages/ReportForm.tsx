import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { MapPin, CheckCircle, Flame, Axe, Droplets, Wind } from 'lucide-react';
import MapView from '../components/MapView';
import Confetti from '../components/Confetti';
import { reportService } from '../services/reportService';
import { ReportCategory, CATEGORY_LABELS } from '../types';

const CATEGORY_PTS: Record<ReportCategory, number> = {
  wildfire: 30,
  illegal_logging: 20,
  water_leak: 15,
  pollution: 10,
};

const CATEGORY_META: Record<ReportCategory, { Icon: React.ElementType; color: string; bg: string; darkBg: string }> = {
  wildfire:        { Icon: Flame,    color: 'text-red-600',    bg: 'bg-red-50 border-red-200',      darkBg: 'dark:bg-red-900/20 dark:border-red-800'    },
  illegal_logging: { Icon: Axe,     color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200',   darkBg: 'dark:bg-amber-900/20 dark:border-amber-800' },
  water_leak:      { Icon: Droplets, color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',    darkBg: 'dark:bg-blue-900/20 dark:border-blue-800'   },
  pollution:       { Icon: Wind,    color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200',  darkBg: 'dark:bg-slate-800 dark:border-slate-700'    },
};

const categories: ReportCategory[] = ['wildfire', 'illegal_logging', 'water_leak', 'pollution'];

const ReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '' as ReportCategory | '',
    latitude: '',
    longitude: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setForm(p => ({ ...p, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5 MB.'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.category) { setError('Please select a category.'); return false; }
      if (!form.title.trim() || form.title.length < 5) { setError('Title must be at least 5 characters.'); return false; }
      if (!form.description.trim() || form.description.length < 10) { setError('Description must be at least 10 characters.'); return false; }
    }
    if (step === 2) {
      if (!form.latitude || !form.longitude) { setError('Click on the map to pin the incident location.'); return false; }
    }
    setError('');
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(p => p + 1); };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('latitude', form.latitude);
      fd.append('longitude', form.longitude);
      if (imageFile) fd.append('image', imageFile);

      await reportService.create(fd);

      const pts = CATEGORY_PTS[form.category as ReportCategory] ?? 10;
      setShowConfetti(true);

      toast.custom(
        () => (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-green-200 dark:border-green-800 p-4 max-w-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Report submitted!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                You earned{' '}
                <span className="font-bold text-green-600 dark:text-green-400">+{pts} Green pts</span>.{' '}
                Get it verified for{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400">+20 more</span>!
              </p>
            </div>
          </motion.div>
        ),
        { duration: 5000 }
      );

      setTimeout(() => {
        setShowConfetti(false);
        navigate('/');
      }, 2200);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['Details', 'Location', 'Photo'];

  return (
    <>
      <Confetti active={showConfetti} />

      <div className="max-w-2xl mx-auto">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-7">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const isDone   = step > n;
            const isActive = step === n;
            return (
              <React.Fragment key={n}>
                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{
                      backgroundColor: isDone ? '#16a34a' : isActive ? 'transparent' : 'transparent',
                      borderColor: isDone || isActive ? '#16a34a' : '#e2e8f0',
                      scale: isActive ? 1.08 : 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    style={{ color: isDone ? '#fff' : isActive ? '#16a34a' : '#94a3b8' }}
                  >
                    {isDone
                      ? <CheckCircle className="w-4 h-4" />
                      : n}
                  </motion.div>
                  <span className={`text-[11px] mt-1 font-medium ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <motion.div
                    className="flex-1 h-0.5 mx-2 mb-5 rounded-full"
                    animate={{ backgroundColor: step > n ? '#16a34a' : '#e2e8f0' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="card">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-xl mb-5 overflow-hidden"
              >
                <span className="shrink-0 w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center text-[10px] font-black">!</span>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* Step 1: Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Incident Details</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Describe what you observed clearly and accurately.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => {
                      const m = CATEGORY_META[cat];
                      const pts = CATEGORY_PTS[cat];
                      const isSelected = form.category === cat;
                      return (
                        <motion.button
                          key={cat}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, category: cat }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left relative ${
                            isSelected
                              ? `border-primary-500 bg-primary-50 dark:bg-primary-900/20 ${m.color}`
                              : `${m.bg} ${m.darkBg} ${m.color} border-opacity-50`
                          }`}
                        >
                          <m.Icon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold truncate">{CATEGORY_LABELS[cat]}</p>
                            <p className="text-[10px] opacity-70">+{pts} pts on submit</p>
                          </div>
                          {isSelected && (
                            <motion.div
                              layoutId="cat-check"
                              className="ml-auto w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center shrink-0"
                            >
                              <CheckCircle className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                  {form.category && (
                    <p className="text-[11px] text-slate-400 mt-2 text-center">
                      Submit earns <strong className="text-green-600 dark:text-green-400">{CATEGORY_PTS[form.category as ReportCategory]} pts</strong> · Verified adds <strong className="text-amber-600 dark:text-amber-400">+20 pts</strong> · Resolved adds <strong className="text-blue-600 dark:text-blue-400">+10 pts</strong>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Title</label>
                  <input
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Brief description of the incident"
                    maxLength={100}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{form.title.length}/100</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                    className="input-field resize-none"
                    rows={4}
                    placeholder="What did you see? When? How severe? Any immediate danger?"
                    maxLength={1000}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">{form.description.length}/1000</p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Pin Location</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Click on the map to mark the exact incident location.</p>
                </div>

                <div style={{ height: 320, borderRadius: 14, overflow: 'hidden' }} className="border border-slate-200 dark:border-slate-700 shadow-sm">
                  <MapView
                    height="100%"
                    center={[33.5228, -5.1071]}
                    zoom={12}
                    onMapClick={handleMapClick}
                    selectedLocation={selectedLocation}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'latitude', label: 'Latitude', placeholder: '33.5228' },
                    { name: 'longitude', label: 'Longitude', placeholder: '-5.1071' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{f.label}</label>
                      <input
                        name={f.name}
                        type="number"
                        step="0.000001"
                        value={form[f.name as 'latitude' | 'longitude']}
                        onChange={handleChange}
                        className="input-field text-sm font-mono"
                        placeholder={f.placeholder}
                      />
                    </div>
                  ))}
                </div>

                {selectedLocation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs px-3 py-2.5 rounded-xl"
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>Location pinned: {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Photo */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Photo Evidence</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Optional — attach a photo to support your report (max 5 MB).</p>
                </div>

                <motion.div
                  whileHover={{ borderColor: '#16a34a' }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="max-h-44 mx-auto rounded-xl shadow-sm" />
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm transition-colors"
                      >×</button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Click to upload a photo</p>
                      <p className="text-slate-400 text-xs mt-1">JPEG, PNG, WebP — max 5 MB</p>
                    </div>
                  )}
                </motion.div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />

                {/* Summary */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-2 border border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Summary</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Category', value: CATEGORY_LABELS[form.category as ReportCategory] },
                      { label: 'Title', value: form.title },
                      { label: 'Coordinates', value: `${parseFloat(form.latitude).toFixed(4)}, ${parseFloat(form.longitude).toFixed(4)}` },
                    ].map(row => (
                      <div key={row.label} className="flex gap-2 text-xs">
                        <span className="text-slate-400 w-20 shrink-0">{row.label}</span>
                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate">{row.value}</span>
                      </div>
                    ))}
                    {form.category && (
                      <div className="flex gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
                        <span className="text-slate-400 w-20 shrink-0">XP reward</span>
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          +{CATEGORY_PTS[form.category as ReportCategory]} pts on submit · +20 if verified · +10 if resolved
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(p => p - 1)} className="btn-secondary">
                Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <motion.button
                type="button"
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary px-6"
              >
                Continue
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary px-6 min-w-[130px] justify-center"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting…
                  </span>
                ) : 'Submit Report'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ReportForm;
