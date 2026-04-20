import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Form, Spinner } from '@openedx/paragon';

/**
 * SearchableSelect
 *
 * A reusable single-select autocomplete dropdown backed by an in-memory list.
 * Filters options by label as the user types. Supports keyboard navigation
 * (↑ / ↓ / Enter / Escape) and click-outside-to-close.
 *
 * Props
 * ─────
 *   id          {string}  – wired to the input `id` and label `htmlFor`
 *   label       {string}  – visible form label text
 *   options     {Array}   – [{ value, label, ...extras }] filtered in-memory by label
 *   value       {object|null} – currently selected option, or null
 *   onChange    {function} – (option | null) → void
 *   placeholder {string}
 *   disabled    {boolean}
 *   loading     {boolean} – shows a spinner in the dropdown while options are fetching
 *   required    {boolean} – appends " *" to the label
 */
const SearchableSelect = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
  required,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Close the dropdown when the user clicks outside the component
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  // Keep query in sync when value is cleared externally (e.g. parent resets state)
  useEffect(() => {
    if (!value) { setQuery(''); }
  }, [value]);

  const filteredOptions = options.filter(
    (o) => o.label.toLowerCase().includes(query.toLowerCase()),
  );

  const selectOption = (option) => {
    onChange(option);
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setFocusedIndex(-1);
    // Typing after a confirmed selection clears the selection
    if (value) { onChange(null); }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key !== 'Escape') { setIsOpen(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          selectOption(filteredOptions[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Show the selected option's label in the input; otherwise show the live query
  const inputDisplayValue = value ? value.label : query;

  return (
    <Form.Group className="mb-3">
      <Form.Label htmlFor={id}>
        {label}{required && ' *'}
      </Form.Label>

      <div ref={containerRef} style={{ position: 'relative' }}>
        {/* Input */}
        <Form.Control
          id={id}
          type="text"
          value={inputDisplayValue}
          onChange={handleInputChange}
          onFocus={() => { if (!value) { setIsOpen(true); } }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${id}-listbox`}
        />

        {/* Dropdown list */}
        {isOpen && !disabled && (
          <div
            id={`${id}-listbox`}
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1050,
              border: '1px solid #ced4da',
              borderRadius: '0.375rem',
              backgroundColor: '#fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: '200px',
              overflowY: 'auto',
              marginTop: '2px',
            }}
          >
            {loading && (
              <div className="d-flex justify-content-center align-items-center p-3">
                <Spinner animation="border" size="sm" />
              </div>
            )}
            {!loading && filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-muted" style={{ fontSize: '0.875rem' }}>
                No results found
              </div>
            )}
            {!loading && filteredOptions.map((option, index) => (
              <div
                key={option.value}
                role="option"
                aria-selected={value?.value === option.value}
                onMouseDown={(e) => {
                  // Prevent the input from blurring before the click registers
                  e.preventDefault();
                  selectOption(option);
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                style={{
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  backgroundColor: index === focusedIndex ? '#f0f4ff' : 'transparent',
                  color: value?.value === option.value ? '#0d6efd' : '#212529',
                  fontWeight: value?.value === option.value ? 600 : 400,
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </Form.Group>
  );
};

SearchableSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  value: PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  }),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  required: PropTypes.bool,
};

SearchableSelect.defaultProps = {
  options: [],
  value: null,
  placeholder: 'Search...',
  disabled: false,
  loading: false,
  required: false,
};

export default SearchableSelect;
