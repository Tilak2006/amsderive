import { useState, useRef, useEffect } from 'react';
import { UNIVERSITIES } from '../../utils/universities';
import styles from './UniversitySelect.module.css';

/**
 * Searchable university selection dropdown with optional custom institution name.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, required?: boolean }} props
 */
export default function UniversitySelect({
  label,
  name,
  value = '',
  onChange,
  error = '',
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(value && !UNIVERSITIES.some((u) => u.name === value));
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Filter universities based on search term
  const filteredUniversities = UNIVERSITIES.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique categories for grouping
  const getGroupedUniversities = () => {
    const groups = {};
    filteredUniversities.forEach((u) => {
      if (!groups[u.category]) {
        groups[u.category] = [];
      }
      groups[u.category].push(u);
    });
    return groups;
  };

  function handleInputChange(e) {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    setIsOpen(true);
  }

  function handleSelect(selectedValue) {
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    setShowCustomInput(selectedValue === 'Other');

    if (selectedValue === 'Other') {
      onChange({
        target: {
          name,
          value: '',
          type: 'text',
        },
      });
    } else {
      onChange({
        target: {
          name,
          value: selectedValue,
          type: 'text',
        },
      });
    }
  }

  function handleCustomChange(e) {
    onChange({
      target: {
        name,
        value: e.target.value,
        type: 'text',
      },
    });
  }

  function handleKeyDown(e) {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const allOptions = filteredUniversities.filter((u) => u.category !== 'Other');
    const totalOptions = allOptions.length + (filteredUniversities.some((u) => u.name === 'Other') ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < totalOptions - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < totalOptions) {
          const option = highlightedIndex < allOptions.length ? allOptions[highlightedIndex] : null;
          if (option) {
            handleSelect(option.name);
          } else {
            handleSelect('Other');
          }
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

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[data-option]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Close dropdown when clicking outside
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
  const groupedUniversities = getGroupedUniversities();
  const categoryOrder = ['IIT', 'NIT', 'IIIT', 'Top Colleges', 'Other'];

  return (
    <div className={styles['university-select-field']} ref={containerRef}>
      <label htmlFor={name} className={styles['university-select-label']}>
        {label}
        {required && <span className={styles['university-select-required']}> *</span>}
      </label>

      <div className={styles['university-select-wrapper']}>
        <input
          ref={inputRef}
          id={name}
          type="text"
          placeholder={value || 'Search institution...'}
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
            {filteredUniversities.length === 0 ? (
              <li className={styles['university-select-no-results']}>No institutions found</li>
            ) : (
              categoryOrder.map(
                (category) =>
                  groupedUniversities[category] && (
                    <li key={category}>
                      <ul className={styles['university-select-group']} role="presentation">
                        <li className={styles['university-select-category']}>{category}</li>
                        {groupedUniversities[category].map((u, idx) => {
                          const optionIndex = Object.values(groupedUniversities)
                            .slice(0, categoryOrder.indexOf(category))
                            .reduce((acc, group) => acc + group.length, 0) + idx;

                          return (
                            <li
                              key={u.name}
                              data-option
                              onClick={() => handleSelect(u.name)}
                              className={`${styles['university-select-option']} ${
                                highlightedIndex === optionIndex ? styles['university-select-option-highlighted'] : ''
                              }`}
                              role="option"
                              aria-selected={value === u.name || (searchTerm && u.name === searchTerm)}
                            >
                              {u.name}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  )
              )
            )}
          </ul>
        )}
      </div>

      {showCustomInput && (
        <input
          type="text"
          name={`${name}Custom`}
          value={value}
          onChange={handleCustomChange}
          placeholder="Enter your institution name"
          className={styles['university-custom-input']}
          aria-label="Custom institution name"
        />
      )}

      {error && (
        <p id={`${name}-error`} className={styles['university-select-error-msg']} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
