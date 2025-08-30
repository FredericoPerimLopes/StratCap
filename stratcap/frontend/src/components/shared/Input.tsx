import React from 'react';
import {
  TextField,
  TextFieldProps,
  styled,
  FormHelperText,
  InputLabel,
  FormControl,
} from '@mui/material';
import { useController, Control, FieldPath, FieldValues } from 'react-hook-form';

const StyledTextField = styled(TextField)(({ theme, error }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    backgroundColor: '#ffffff',
    fontSize: '0.875rem',
    '& fieldset': {
      borderColor: error ? theme.palette.error.main : '#e2e8f0',
      borderWidth: 1,
    },
    '&:hover fieldset': {
      borderColor: error ? theme.palette.error.main : '#3b82f6',
    },
    '&.Mui-focused fieldset': {
      borderColor: error ? theme.palette.error.main : '#1e3a8a',
      borderWidth: 2,
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.875rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: error ? theme.palette.error.main : '#1e3a8a',
    },
  },
}));

export interface InputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<TextFieldProps, 'name'> {
  name: TName;
  control?: Control<TFieldValues>;
  rules?: any;
}

export const Input = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  control,
  rules,
  ...props
}: InputProps<TFieldValues, TName>) => {
  if (control) {
    const {
      field: { onChange, onBlur, value, ref },
      fieldState: { error },
    } = useController({
      name,
      control,
      rules,
    });

    return (
      <StyledTextField
        {...props}
        name={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
        error={!!error}
        helperText={error?.message || props.helperText}
      />
    );
  }

  return <StyledTextField {...props} name={name} />;
};

export default Input;