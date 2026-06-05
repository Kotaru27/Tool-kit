import React from 'react';

interface SpecialInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const SpecialInput = React.forwardRef<HTMLInputElement, SpecialInputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={[
        'bg-bg-main  border border-border-color text-text-main font-mono text-sm',
        'rounded-[6px] px-4 h-12 w-full',
        'transition-all duration-200',
        'focus:border-[#2F2F2F] focus:bg-[rgba(255,255,255,0.02)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]',
        'placeholder:text-text-subtle',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
);
SpecialInput.displayName = 'SpecialInput';

interface SpecialTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const SpecialTextarea = React.forwardRef<HTMLTextAreaElement, SpecialTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={[
        'bg-bg-main  border border-border-color text-text-main font-mono text-sm',
        'rounded-[6px] p-4 w-full resize-y leading-relaxed',
        'transition-all duration-200',
        'focus:border-[#2F2F2F] focus:bg-[rgba(255,255,255,0.02)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.04)]',
        'placeholder:text-text-subtle',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
);
SpecialTextarea.displayName = 'SpecialTextarea';
