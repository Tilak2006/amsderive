import { useState, useEffect, useCallback, useRef } from 'react';
import TextInput from './TextInput';
import UniversitySelect from './UniversitySelect';
import BranchSelect from './BranchSelect';
import FileUpload from './FileUpload';
import Button from '../ui/Button';
import styles from './RegistrationForm.module.css';
import {
  validateName,
  validateEmail,
  validateUniversity,
  validateCodeforcesHandleFormat,
  validateIndianPhone,
  validateLinkedInOptional,
  validateGitHubOptional,
  validateBranch,
} from '../../utils/validators';
import { validateFileType, validateFileSize } from '../../utils/fileValidation';
import { createValidationDebouncer } from '../../utils/formOptimization';

const RESUME_ALLOWED_TYPES = ['application/pdf'];
const RESUME_MAX_SIZE = 300 * 1024; // 300KB
const ID_ALLOWED_TYPES = ['application/pdf'];
const ID_MAX_SIZE = 300 * 1024; // 300KB

/**
 * Registration form collecting participant information.
 * @param {{ onSubmit: Function, loading?: boolean }} props
 */
export default function RegistrationForm({ onSubmit, loading = false }) {
  const [fields, setFields] = useState({
    fullName: '',
    email: '',
    university: '',
    branch: '',
    graduationYear: '',
    codeforcesHandle: '',
    phoneNumber: '',
    linkedIn: '',
    gitHub: '',
    dataConsent: false,
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [errors, setErrors] = useState({});

  const [cfVerifying, setCfVerifying] = useState(false);

  // Create isolated debouncer instance for this component
  const debouncerRef = useRef(null);
  if (!debouncerRef.current) {
    debouncerRef.current = createValidationDebouncer();
  }

  // Cleanup debounced validations on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending validations
      if (debouncerRef.current) {
        debouncerRef.current.cancelAll();
      }
    };
  }, []);

  function validateFieldDebounced(fieldName, value) {
    // Immediately show verifying state for CF handle
    if (fieldName === 'codeforcesHandle' && value.trim()) {
      setCfVerifying(true);
    }

    // Debounce validation at 150ms to prevent excessive updates
    debouncerRef.current.debounce(fieldName, () => {
      let error = '';

      if (fieldName === 'fullName') {
        const result = validateName(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'email') {
        const result = validateEmail(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'university') {
        const result = validateUniversity(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'branch') {
        const result = validateBranch(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'graduationYear') {
        if (!value) error = 'Graduation year is required';
      } else if (fieldName === 'codeforcesHandle') {
        const result = validateCodeforcesHandleFormat(value);
        if (!result.valid) error = result.error;

        // UX: clear verifying state since validation is done
        // Add a slight delay just so the user sees the "Verifying..." hint briefly
        setTimeout(() => setCfVerifying(false), 800);
      } else if (fieldName === 'phoneNumber') {
        const result = validateIndianPhone(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'linkedIn') {
        if (!value.trim()) {
          error = 'LinkedIn profile is required';
        } else {
          const result = validateLinkedInOptional(value);
          if (!result.valid) error = result.error;
        }
      } else if (fieldName === 'gitHub') {
        if (!value.trim()) {
          error = 'GitHub profile is required';
        } else {
          const result = validateGitHubOptional(value);
          if (!result.valid) error = result.error;
        }
      }

      if (error) {
        setErrors((prev) => ({ ...prev, [fieldName]: error }));
      } else {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[fieldName];
          return updated;
        });
      }
    }, 150); // 150ms debounce delay
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFields((prev) => ({ ...prev, [name]: newValue }));

    // Immediately clear error on input, validate with debounce
    if (errors[name]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }

    // Debounce field validation for non-checkbox fields
    if (type !== 'checkbox') {
      validateFieldDebounced(name, newValue);
    }
  }

  function handleResumeSelect(file) {
    setResumeFile(file);
    if (errors.resume) {
      setErrors((prev) => ({ ...prev, resume: '' }));
    }
  }

  function handleTranscriptSelect(file) {
    setTranscriptFile(file);
    if (errors.transcript) {
      setErrors((prev) => ({ ...prev, transcript: '' }));
    }
  }

  const validateAll = useCallback(() => {
    const newErrors = {};

    // Full name validation
    const nameResult = validateName(fields.fullName);
    if (!nameResult.valid) newErrors.fullName = nameResult.error;

    // Email validation
    const emailResult = validateEmail(fields.email);
    if (!emailResult.valid) newErrors.email = emailResult.error;

    // University validation
    const universityResult = validateUniversity(fields.university);
    if (!universityResult.valid) newErrors.university = universityResult.error;

    // Branch validation
    const branchResult = validateBranch(fields.branch);
    if (!branchResult.valid) newErrors.branch = branchResult.error;

    // Graduation year validation
    if (!fields.graduationYear) newErrors.graduationYear = 'Graduation year is required';

    // Codeforces handle validation
    const cfResult = validateCodeforcesHandleFormat(fields.codeforcesHandle);
    if (!cfResult.valid) newErrors.codeforcesHandle = cfResult.error;

    // Phone Number validation
    const phoneResult = validateIndianPhone(fields.phoneNumber);
    if (!phoneResult.valid) newErrors.phoneNumber = phoneResult.error;

    // LinkedIn validation (required)
    if (!fields.linkedIn.trim()) {
      newErrors.linkedIn = 'LinkedIn profile is required';
    } else {
      const linkedInResult = validateLinkedInOptional(fields.linkedIn);
      if (!linkedInResult.valid) newErrors.linkedIn = linkedInResult.error;
    }

    // GitHub validation (optional)
    const gitHubResult = validateGitHubOptional(fields.gitHub);
    if (!gitHubResult.valid) newErrors.gitHub = gitHubResult.error;

    // Resume file validation
    if (!resumeFile) {
      newErrors.resume = 'Resume is required';
    } else {
      const resumeTypeResult = validateFileType(resumeFile, RESUME_ALLOWED_TYPES);
      if (!resumeTypeResult.valid) {
        newErrors.resume = 'Resume must be a PDF';
      } else {
        const resumeSizeResult = validateFileSize(resumeFile, RESUME_MAX_SIZE);
        if (!resumeSizeResult.valid) newErrors.resume = 'Resume must be under 300KB';
      }
    }

    // Transcript file validation
    if (!transcriptFile) {
      newErrors.transcript = 'Transcript is required';
    } else {
      const transcriptTypeResult = validateFileType(transcriptFile, ID_ALLOWED_TYPES);
      if (!transcriptTypeResult.valid) {
        newErrors.transcript = 'Transcript must be a PDF';
      } else {
        const transcriptSizeResult = validateFileSize(transcriptFile, ID_MAX_SIZE);
        if (!transcriptSizeResult.valid) newErrors.transcript = 'Transcript must be under 300KB';
      }
    }

    // Data consent validation
    if (!fields.dataConsent) {
      newErrors.dataConsent = 'You must consent to data sharing';
    }

    return newErrors;
  }, [fields, resumeFile, transcriptFile]);

  function handleSubmit(e) {
    e.preventDefault();
    const snapshot = { ...fields };
    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onSubmit) {
      // Read referral code from localStorage (set by _app.jsx from URL ?ref= param)
      const refCode = typeof window !== 'undefined'
        ? localStorage.getItem('ams_derive_ref') || null
        : null;

      onSubmit(
        {
          fullName: snapshot.fullName.trim(),
          email: snapshot.email.trim(),
          university: snapshot.university.trim(),
          branch: snapshot.branch.trim(),
          graduationYear: snapshot.graduationYear,
          codeforcesHandle: snapshot.codeforcesHandle.trim(),
          phoneNumber: snapshot.phoneNumber.trim(),
          linkedIn: snapshot.linkedIn.trim(),
          gitHub: snapshot.gitHub.trim(),
          dataConsent: snapshot.dataConsent,
          resumeFile,
          transcriptFile,
          refCode,
        },
        setErrors
      );
    }
  }

  return (
    <form className={styles.registrationForm} onSubmit={handleSubmit} noValidate>
      <div className={styles.terminalLabel}>$ ams-derive-register</div>
      <div className={styles.terminalForm}>
        {/* Personal Details Section - 2 Column */}
        <div className={styles.formGridRow}>
          <TextInput
            label="Full Name"
            name="fullName"
            value={fields.fullName}
            onChange={handleChange}
            error={errors.fullName}
            placeholder="Your full name"
            required
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={fields.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="your.email@example.com"
            required
          />
        </div>

        {/* University / Institution - Full Width */}
        <UniversitySelect
          label="University / Institution"
          name="university"
          value={fields.university}
          onChange={handleChange}
          error={errors.university}
          required
        />

        {/* Branch + Graduation Year - 2 Column */}
        <div className={styles.formGridRow}>
          <BranchSelect
            label="Branch / Discipline"
            name="branch"
            value={fields.branch}
            onChange={handleChange}
            error={errors.branch}
            required
          />
          <div className={styles.selectField}>
            <label htmlFor="graduationYear" className={styles.selectLabel}>
              Graduation Year<span className={styles.selectRequired}> *</span>
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="graduationYear"
                name="graduationYear"
                value={fields.graduationYear}
                onChange={handleChange}
                className={`${styles.selectInput} ${errors.graduationYear ? styles.selectInputError : ''}`}
                aria-invalid={!!errors.graduationYear}
                aria-describedby={errors.graduationYear ? 'graduationYear-error' : undefined}
              >
                <option value="">Select year</option>
                {[2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <span className={styles.selectChevron} aria-hidden="true">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
            {errors.graduationYear && (
              <p id="graduationYear-error" className={styles.selectErrorMsg} role="alert">
                {errors.graduationYear}
              </p>
            )}
          </div>
        </div>

        {/* Competitive Programming Handles - Single Column */}
        <div className={styles.cfInputWrap}>
          <TextInput
            label="Codeforces Handle"
            name="codeforcesHandle"
            value={fields.codeforcesHandle}
            onChange={handleChange}
            error={errors.codeforcesHandle}
            placeholder="cf_username"
            hint="Alphanumeric and underscores only. Max 24 characters"
            required
          />
          {cfVerifying && !errors.codeforcesHandle && (
            <span className={styles.verifyingHint}>Verifying...</span>
          )}
        </div>

        <TextInput
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          value={fields.phoneNumber}
          onChange={handleChange}
          error={errors.phoneNumber}
          placeholder="XXXXXXXXXX"
          hint="10-digit phone number"
          prefix="+91"
          required
        />

        <div className={styles.formGridRow}>
          <TextInput
            label="LinkedIn Profile"
            name="linkedIn"
            type="url"
            value={fields.linkedIn}
            onChange={handleChange}
            error={errors.linkedIn}
            placeholder="linkedin.com/in/yourprofile"
            hint="Your LinkedIn profile URL"
            required
          />
          <TextInput
            label="GitHub Profile"
            name="gitHub"
            type="url"
            value={fields.gitHub}
            onChange={handleChange}
            error={errors.gitHub}
            placeholder="github.com/yourprofile"
            hint="Your GitHub profile URL (Optional)"
          />
        </div>

        {/* Divider */}
        <div className={styles.formDivider} />

        {/* File Uploads - Single Column */}
        <FileUpload
          label="Resume"
          name="resume"
          accept="application/pdf"
          onFileSelect={handleResumeSelect}
          error={errors.resume}
          file={resumeFile}
          hint="PDF only, max 300KB"
          required
        />

        <FileUpload
          label="Transcript"
          name="transcript"
          accept="application/pdf"
          onFileSelect={handleTranscriptSelect}
          error={errors.transcript}
          file={transcriptFile}
          hint="PDF only, max 300KB"
          infoTooltip="Most recent transcript (college / highschool marksheet)"
          required
        />

        {/* Data Consent Checkbox */}
        <div className={styles.consentField}>
          <label className={styles.consentCheckbox}>
            <input
              type="checkbox"
              name="dataConsent"
              checked={fields.dataConsent}
              onChange={handleChange}
              required
            />
            <span className={styles.checkboxLabel}>
              I consent to my profile being shared with partner firms for recruitment purposes
            </span>
          </label>
          {errors.dataConsent && (
            <p className={styles.consentError} role="alert">
              {errors.dataConsent}
            </p>
          )}
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className={styles.submitLoading}>
              Registering
              <span className={`${styles.submitDot} ${styles.submitDot1}`}>&middot;</span>
              <span className={`${styles.submitDot} ${styles.submitDot2}`}>&middot;</span>
              <span className={`${styles.submitDot} ${styles.submitDot3}`}>&middot;</span>
            </span>
          ) : (
            'Submit Registration'
          )}
        </Button>
      </div>
    </form>
  );
}
