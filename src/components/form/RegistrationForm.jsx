import { useState } from 'react';
import TextInput from './TextInput';
import FileUpload from './FileUpload';
import Button from '../ui/Button';
import { validateName, validateInstitution, validateCodeforcesHandle, validateCodechefHandle } from '../../utils/validators';
import { validateFileType, validateFileSize } from '../../utils/fileValidation';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Registration form collecting name, institution, CF/CC handles, and ID upload.
 * @param {{ onSubmit: Function, loading?: boolean }} props
 */
export default function RegistrationForm({ onSubmit, loading = false }) {
  const [fields, setFields] = useState({
    name: '',
    institution: '',
    cfHandle: '',
    ccHandle: '',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }

  function handleFileSelect(selected) {
    setFile(selected);
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  }

  function validateAll() {
    const newErrors = {};

    const nameResult = validateName(fields.name);
    if (!nameResult.valid) newErrors.name = nameResult.error;

    const instResult = validateInstitution(fields.institution);
    if (!instResult.valid) newErrors.institution = instResult.error;

    const cfResult = validateCodeforcesHandle(fields.cfHandle);
    if (!cfResult.valid) newErrors.cfHandle = cfResult.error;

    const ccResult = validateCodechefHandle(fields.ccHandle);
    if (!ccResult.valid) newErrors.ccHandle = ccResult.error;

    if (!file) {
      newErrors.file = 'ID card is required';
    } else {
      const typeResult = validateFileType(file, ALLOWED_TYPES);
      if (!typeResult.valid) {
        newErrors.file = typeResult.error;
      } else {
        const sizeResult = validateFileSize(file, MAX_FILE_SIZE);
        if (!sizeResult.valid) newErrors.file = sizeResult.error;
      }
    }

    return newErrors;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validateAll();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (onSubmit) {
      onSubmit({ ...fields, file }, setErrors);
    }
  }

  return (
    <form className="registration-form" onSubmit={handleSubmit} noValidate>
      <TextInput
        label="Full Name"
        name="name"
        value={fields.name}
        onChange={handleChange}
        error={errors.name}
        placeholder="Your full name"
        required
      />
      <TextInput
        label="Institution"
        name="institution"
        value={fields.institution}
        onChange={handleChange}
        error={errors.institution}
        placeholder="College / University / School"
        required
      />
      <TextInput
        label="Codeforces Handle"
        name="cfHandle"
        value={fields.cfHandle}
        onChange={handleChange}
        error={errors.cfHandle}
        placeholder="cf_username"
        hint="Max 24 characters, no dots"
        required
      />
      <TextInput
        label="CodeChef Handle"
        name="ccHandle"
        value={fields.ccHandle}
        onChange={handleChange}
        error={errors.ccHandle}
        placeholder="cc_username"
        hint="Max 24 characters, no dots"
        required
      />
      <FileUpload
        label="ID Card"
        name="file"
        accept="image/jpeg,image/png,application/pdf"
        onFileSelect={handleFileSelect}
        error={errors.file}
        file={file}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <span className="submit-loading">
            Submitting
            <span className="submit-dot submit-dot-1">&middot;</span>
            <span className="submit-dot submit-dot-2">&middot;</span>
            <span className="submit-dot submit-dot-3">&middot;</span>
          </span>
        ) : (
          'Submit Registration'
        )}
      </Button>
    </form>
  );
}
