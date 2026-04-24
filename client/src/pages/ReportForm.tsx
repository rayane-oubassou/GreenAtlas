import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import { reportService } from '../services/reportService';
import { ReportCategory, CATEGORY_LABELS, CATEGORY_ICONS } from '../types';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    setForm((p) => ({
      ...p,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (!form.title.trim() || form.title.length < 5) { setError('Title must be at least 5 characters.'); return false; }
      if (!form.description.trim() || form.description.length < 10) { setError('Description must be at least 10 characters.'); return false; }
      if (!form.category) { setError('Please select a category.'); return false; }
    }
    if (step === 2) {
      if (!form.latitude || !form.longitude) { setError('Please click on the map or enter coordinates.'); return false; }
    }
    setError('');
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep((p) => p + 1); };

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
      navigate('/', { state: { success: 'Incident reported successfully!' } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['Details', 'Location', 'Photo'];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const isDone = step > n;
          const isActive = step === n;
          return (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  isDone ? 'bg-primary-600 border-primary-600 text-white'
                    : isActive ? 'border-primary-600 text-primary-600 bg-primary-50'
                    : 'border-slate-200 text-slate-400 bg-white'
                }`}>
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : n}
                </div>
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 ${step > n ? 'bg-primary-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="card">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            {error}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Incident Details</h2>
              <p className="text-sm text-slate-500">Describe the environmental incident clearly.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all text-left ${
                      form.category === cat
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{CATEGORY_ICONS[cat]}</span>
                    <span>{CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Title *</label>
              <input
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                className="input-field"
                placeholder="Brief description of the incident"
                maxLength={100}
              />
              <p className="text-xs text-slate-400 mt-1">{form.title.length}/100 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange as React.ChangeEventHandler<HTMLTextAreaElement>}
                className="input-field resize-none"
                rows={4}
                placeholder="Detailed description: what you saw, when, severity..."
                maxLength={1000}
              />
              <p className="text-xs text-slate-400 mt-1">{form.description.length}/1000 characters</p>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Location</h2>
              <p className="text-sm text-slate-500">Click on the map to pin the incident location, or enter coordinates manually.</p>
            </div>

            <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden' }}>
              <MapView
                height="100%"
                center={[33.5228, -5.1071]}
                zoom={12}
                onMapClick={handleMapClick}
                selectedLocation={selectedLocation}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Latitude</label>
                <input
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="e.g. 33.5228"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Longitude</label>
                <input
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={handleChange}
                  className="input-field text-sm"
                  placeholder="e.g. -5.1071"
                />
              </div>
            </div>

            {selectedLocation && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
                <span>📍</span>
                <span>Location selected: {selectedLocation[0].toFixed(5)}, {selectedLocation[1].toFixed(5)}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Photo */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Photo Evidence</h2>
              <p className="text-sm text-slate-500">Add a photo to support your report (optional, max 5 MB).</p>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                imagePreview ? 'border-primary-300 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg shadow-sm" />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >×</button>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">Click to upload photo</p>
                  <p className="text-slate-400 text-xs mt-1">JPEG, PNG, WebP — max 5 MB</p>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Report Summary</h4>
              <div className="text-xs space-y-1 text-slate-600">
                <p><span className="text-slate-400">Category:</span> {CATEGORY_ICONS[form.category as ReportCategory]} {CATEGORY_LABELS[form.category as ReportCategory]}</p>
                <p><span className="text-slate-400">Title:</span> {form.title}</p>
                <p><span className="text-slate-400">Location:</span> {form.latitude}, {form.longitude}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6 pt-5 border-t border-slate-100">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((p) => p - 1)} className="btn-secondary">
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button type="button" onClick={handleNext} className="btn-primary px-6">
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="btn-primary px-6">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : '✓ Submit Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportForm;
