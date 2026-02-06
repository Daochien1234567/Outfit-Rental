// components/ui/Select.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  error,
  disabled = false,
  required = false,
  className = '',
  size = 'medium',
  searchable = false,
  multiple = false,
  clearable = false,
  onBlur,
  icon,
  helperText,
  // Các props mới
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  showCheckIcon = true,
  maxHeight = '250px',
  zIndex = 50
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Kích thước
  const sizeClasses = {
    small: 'py-1.5 px-3 text-sm',
    medium: 'py-2.5 px-4 text-sm',
    large: 'py-3.5 px-4 text-base'
  };

  // Styles
  const baseSelectClasses = `
    relative w-full border rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white cursor-pointer'}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 hover:border-gray-400'}
    ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
    ${sizeClasses[size]}
  `;

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  // Focus search input khi mở dropdown
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen || disabled) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (!multiple) {
            setIsOpen(false);
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredOptions, multiple, disabled]);

  // Reset highlighted index khi filter thay đổi
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Lọc options
  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchTerm) return options;
    
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchable, searchTerm]);

  // Lấy label của giá trị đã chọn
  const getSelectedLabel = useCallback(() => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return placeholder;
      
      const selectedOptions = options.filter((opt) => value.includes(opt.value));
      if (selectedOptions.length === 0) return placeholder;
      
      if (selectedOptions.length > 2) {
        return `${selectedOptions.length} mục đã chọn`;
      }
      return selectedOptions.map((opt) => opt.label).join(', ');
    }
    
    const selectedOption = options.find((opt) => opt.value === value);
    return selectedOption?.label || placeholder;
  }, [value, options, multiple, placeholder]);

  // Xử lý chọn option
  const handleSelect = (selectedValue) => {
    if (disabled || loading) return;

    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const newValue = currentValue.includes(selectedValue)
        ? currentValue.filter((v) => v !== selectedValue)
        : [...currentValue, selectedValue];
      onChange({ target: { name, value: newValue } });
    } else {
      onChange({ target: { name, value: selectedValue } });
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Xóa tất cả selections
  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: multiple ? [] : '' } });
  };

  // Xóa 1 item trong multiple select
  const handleRemoveItem = (itemValue, e) => {
    e.stopPropagation();
    if (!Array.isArray(value)) return;
    
    const newValue = value.filter((v) => v !== itemValue);
    onChange({ target: { name, value: newValue } });
  };

  // Kiểm tra option được chọn
  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue);
    }
    return value === optionValue;
  };

  // Render icon
  const renderIcon = () => {
    if (icon) return icon;
    
    return (
      <svg 
        className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className={`block mb-1.5 text-sm font-medium ${error ? 'text-red-600' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Box */}
      <div 
        ref={selectRef}
        className={baseSelectClasses}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {multiple && Array.isArray(value) && value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.slice(0, 3).map((val) => {
                  const option = options.find((opt) => opt.value === val);
                  if (!option) return null;
                  
                  return (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {option.label}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveItem(val, e)}
                          className="hover:text-blue-900 text-xs"
                        >
                          &times;
                        </button>
                      )}
                    </span>
                  );
                })}
                {value.length > 3 && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    +{value.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <span className={`block truncate ${!value ? 'text-gray-400' : ''}`}>
                {loading ? 'Đang tải...' : getSelectedLabel()}
              </span>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {clearable && value && !multiple && !disabled && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Xóa lựa chọn"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
            ) : (
              <div className={`text-gray-400 ${disabled ? 'opacity-50' : ''}`}>
                {renderIcon()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helper text và error */}
      <div className="mt-1 min-h-[20px]">
        {helperText && !error && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-${zIndex}`}
          style={{ maxHeight: maxHeight }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="sticky top-0 p-2 bg-white border-b">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Loading state */}
          {loading ? (
            <div className="py-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            /* Options List */
            <div className="py-1 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className={`
                      px-3 py-2.5 cursor-pointer transition-colors duration-150 flex items-center justify-between
                      ${isSelected(option.value) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                      ${highlightedIndex === index ? 'bg-gray-100' : ''}
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      {multiple && (
                        <div
                          className={`
                            w-4 h-4 border rounded flex items-center justify-center flex-shrink-0
                            ${isSelected(option.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                          `}
                        >
                          {isSelected(option.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>
                    
                    {!multiple && isSelected(option.value) && showCheckIcon && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-gray-500 text-sm">
                  {searchTerm ? 'Không tìm thấy kết quả' : emptyMessage}
                </div>
              )}
            </div>
          )}

          {/* Multiple Select Footer */}
          {multiple && filteredOptions.length > 0 && !loading && (
            <div className="sticky bottom-0 p-2 bg-gray-50 border-t">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  Đã chọn: {Array.isArray(value) ? value.length : 0}/{options.length}
                </span>
                <div className="flex gap-2">
                  {Array.isArray(value) && value.length > 0 && (
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800 transition-colors"
                      onClick={() => onChange({ target: { name, value: [] } })}
                    >
                      Xóa tất cả
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Select;