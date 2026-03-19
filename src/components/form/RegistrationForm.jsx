import { useState, useEffect, useCallback, useRef } from 'react';
import TextInput from './TextInput';
import UniversitySelect from './UniversitySelect';
import FileUpload from './FileUpload';
import Button from '../ui/Button';
import styles from './RegistrationForm.module.css';
import {
  validateName,
  validateEmail,
  validateUniversity,
  validateCodeforcesHandleFormat,
  validateCodechefHandleOptional,
  validateLinkedInOptional,
  validateGitHubOptional,
} from '../../utils/validators';
import { validateFileType, validateFileSize } from '../../utils/fileValidation';
import { createValidationDebouncer } from '../../utils/formOptimization';

const RESUME_ALLOWED_TYPES = ['application/pdf'];
const RESUME_MAX_SIZE = 400 * 1024; // 400KB
const ID_ALLOWED_TYPES = ['application/pdf'];
const ID_MAX_SIZE = 100 * 1024; // 100KB

/**
 * Registration form collecting participant information.
 * @param {{ onSubmit: Function, loading?: boolean }} props
 */
export default function RegistrationForm({ onSubmit, loading = false }) {
  const [fields, setFields] = useState({
    fullName: '',
    email: '',
    university: '',
    codeforcesHandle: '',
    codechefHandle: '',
    linkedIn: '',
    gitHub: '',
    dataConsent: false,
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [errors, setErrors] = useState({});

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
      } else if (fieldName === 'codeforcesHandle') {
        const result = validateCodeforcesHandleFormat(value);
        if (!result.valid) error = result.error;
      } else if (fieldName === 'codechefHandle') {
        const result = validateCodechefHandleOptional(value);
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

  function handleIdCardSelect(file) {
    setIdCardFile(file);
    if (errors.idCard) {
      setErrors((prev) => ({ ...prev, idCard: '' }));
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

    // Codeforces handle validation
    const cfResult = validateCodeforcesHandleFormat(fields.codeforcesHandle);
    if (!cfResult.valid) newErrors.codeforcesHandle = cfResult.error;

    // CodeChef handle validation (optional)
    const ccResult = validateCodechefHandleOptional(fields.codechefHandle);
    if (!ccResult.valid) newErrors.codechefHandle = ccResult.error;

    // LinkedIn validation (required)
    if (!fields.linkedIn.trim()) {
      newErrors.linkedIn = 'LinkedIn profile is required';
    } else {
      const linkedInResult = validateLinkedInOptional(fields.linkedIn);
      if (!linkedInResult.valid) newErrors.linkedIn = linkedInResult.error;
    }

    // GitHub validation (required)
    if (!fields.gitHub.trim()) {
      newErrors.gitHub = 'GitHub profile is required';
    } else {
      const gitHubResult = validateGitHubOptional(fields.gitHub);
      if (!gitHubResult.valid) newErrors.gitHub = gitHubResult.error;
    }

    // Resume file validation
    if (!resumeFile) {
      newErrors.resume = 'Resume is required';
    } else {
      const resumeTypeResult = validateFileType(resumeFile, RESUME_ALLOWED_TYPES);
      if (!resumeTypeResult.valid) {
        newErrors.resume = 'Resume must be a PDF';
      } else {
        const resumeSizeResult = validateFileSize(resumeFile, RESUME_MAX_SIZE);
        if (!resumeSizeResult.valid) newErrors.resume = 'Resume must be under 400KB';
      }
    }

    // ID Card file validation
    if (!idCardFile) {
      newErrors.idCard = 'ID card is required';
    } else {
      const idTypeResult = validateFileType(idCardFile, ID_ALLOWED_TYPES);
      if (!idTypeResult.valid) {
        newErrors.idCard = 'ID card must be a PDF';
      } else {
        const idSizeResult = validateFileSize(idCardFile, ID_MAX_SIZE);
        if (!idSizeResult.valid) newErrors.idCard = 'ID card must be under 100KB';
      }
    }

    // Data consent validation
    if (!fields.dataConsent) {
      newErrors.dataConsent = 'You must consent to data sharing';
    }

    return newErrors;
  }, [fields, resumeFile, idCardFile]);

  function handleSubmit(e) {
    e.preventDefault();
    const snapshot = { ...fields };
    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onSubmit) {
      onSubmit(
        {
          fullName: snapshot.fullName.trim(),
          email: snapshot.email.trim(),
          university: snapshot.university.trim(),
          codeforcesHandle: snapshot.codeforcesHandle.trim(),
          codechefHandle: snapshot.codechefHandle.trim(),
          linkedIn: snapshot.linkedIn.trim(),
          gitHub: snapshot.gitHub.trim(),
          dataConsent: snapshot.dataConsent,
          resumeFile,
          idCardFile,
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

      {/* Competitive Programming Handles - Single Column */}
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

      <TextInput
        label="CodeChef Handle"
        name="codechefHandle"
        value={fields.codechefHandle}
        onChange={handleChange}
        error={errors.codechefHandle}
        placeholder="cc_username"
        hint="Optional. Alphanumeric, underscores, and hyphens only."
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
          hint="Your GitHub profile URL"
          required
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
        hint="PDF only, max 400KB"
        required
      />

      <FileUpload
        label="ID Card"
        name="idCard"
        accept="application/pdf"
        onFileSelect={handleIdCardSelect}
        error={errors.idCard}
        file={idCardFile}
        hint="PDF only, max 100KB"
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
