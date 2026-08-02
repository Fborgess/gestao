import { forwardRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';

const normalizeOnBlur = (e, normalize, isEmail, onChange, onBlur) => {
  if (!isEmail) {
    const el = e.target;
    const normalized = normalize(el.value);
    if (normalized !== el.value) {
      el.value = normalized;
      if (onChange) onChange(e);
    }
  }
  if (onBlur) onBlur(e);
};

export const CaseInput = forwardRef(({ value, onChange, onBlur, type, ...props }, ref) => {
  const { normalize } = useSettings();
  const isEmail = type === 'email';
  return (
    <input
      ref={ref}
      type={type}
      value={value}
      {...props}
      onChange={onChange}
      onBlur={(e) => normalizeOnBlur(e, normalize, isEmail, onChange, onBlur)}
    />
  );
});
CaseInput.displayName = 'CaseInput';

export const CaseTextarea = forwardRef(({ value, onChange, onBlur, ...props }, ref) => {
  const { normalize } = useSettings();
  return (
    <textarea
      ref={ref}
      value={value}
      {...props}
      onChange={onChange}
      onBlur={(e) => normalizeOnBlur(e, normalize, false, onChange, onBlur)}
    />
  );
});
CaseTextarea.displayName = 'CaseTextarea';
