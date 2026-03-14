import { useState } from 'react';
import TextInput from './TextInput';
import FileUpload from './FileUpload';
import Button from '../ui/Button';

/**
 * Registration form collecting name, institution, handle, and a file upload.
 * @param {{ onSubmit: Function, loading?: boolean }} props
 */
export default function RegistrationForm({ onSubmit, loading = false }) {
  const [fields, setFields] = useState({
    name: '',
    institution: '',
    handle: '',
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

  function handleFileChange(e) {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (errors.file) {
      setErrors((prev) => ({ ...prev, file: '' }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
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
        placeholder="Enter your full name"
        required
      />
      <TextInput
        label="Institution"
        name="institution"
        value={fields.institution}
        onChange={handleChange}
        error={errors.institution}
        placeholder="University or organization"
        required
      />
      <TextInput
        label="Handle"
        name="handle"
        value={fields.handle}
        onChange={handleChange}
        error={errors.handle}
        placeholder="Codeforces / AtCoder handle"
        required
      />
      <FileUpload
        label="Upload Screenshot"
        name="file"
        accept="image/png,image/jpeg,application/pdf"
        onChange={handleFileChange}
        error={errors.file}
        fileName={file?.name}
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Register'}
      </Button>
    </form>
  );
}
