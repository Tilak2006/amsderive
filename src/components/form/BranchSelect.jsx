import { useState, useRef, useEffect, useMemo } from 'react';
import { BRANCHES } from '../../utils/branches';
import styles from './UniversitySelect.module.css';

/**
 * Searchable branch / discipline selection dropdown.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, required?: boolean }} props
 */
export default function BranchSelect({
  label,
  name,
  value = '',
  onChange,
  error = '',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(
    () => BRANCHES.filter((b) => b.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm]
  );

  function handleInputChange(e) {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    setIsOpen(true);
  }

  function handleSelect(selected) {
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange({ target: { name, value: selected, type: 'text' } });
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const describedBy = error ? `${name}-error` : undefined;

  return (
    <div className={styles['university-select-field']} ref={containerRef}>
      <label htmlFor={name} className={styles['university-select-label']}>
        {label}
        {required && <span className={styles['university-select-required']}> *</span>}
      </label>
      <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#6b6560', letterSpacing: '0.05em' }}>
        Select the closest match if your branch is not listed
      </p>

      <div className={styles['university-select-wrapper']}>
        <input
          id={name}
          type="text"
          placeholder={value || 'Search branch / discipline...'}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className={`${styles['university-select-input']} ${error ? styles['university-select-error'] : ''}`}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {isOpen && (
          <ul className={styles['university-select-list']} ref={listRef} role="listbox">
            {filtered.length === 0 ? (
              <li className={styles['university-select-no-results']}>No branches found</li>
            ) : (
              filtered.map((branch, idx) => (
                <li
                  key={branch}
                  data-option
                  onClick={() => handleSelect(branch)}
                  className={`${styles['university-select-option']} ${
                    highlightedIndex === idx ? styles['university-select-option-highlighted'] : ''
                  }`}
                  role="option"
                  aria-selected={value === branch}
                >
                  {branch}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className={styles['university-select-error-msg']} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
