import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  styled,
  Grid,
} from '@mui/material';
import { useForm, FormProvider, UseFormProps, FieldValues } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const FormContainer = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  border: `1px solid ${theme.palette.divider}`,
}));

const FormHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 3, 2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const FormContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const FormActions = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: '#f8fafc',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: theme.spacing(1),
}));

export interface FormProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<UseFormProps<TFieldValues>, 'resolver'> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  onSubmit: (data: TFieldValues) => void | Promise<void>;
  schema?: yup.AnyObjectSchema;
  loading?: boolean;
  variant?: 'paper' | 'plain';
  spacing?: number;
}

export function Form<TFieldValues extends FieldValues = FieldValues>({
  title,
  subtitle,
  children,
  actions,
  onSubmit,
  schema,
  loading = false,
  variant = 'paper',
  spacing = 3,
  ...formProps
}: FormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    ...formProps,
    resolver: schema ? yupResolver(schema) : undefined,
  });

  const handleSubmit = methods.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  const content = (
    <FormProvider {...methods}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        sx={{
          pointerEvents: loading ? 'none' : 'auto',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {(title || subtitle) && (
          <FormHeader>
            {title && (
              <Typography variant="h5" component="h2" gutterBottom>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </FormHeader>
        )}
        
        <FormContent>
          <Grid container spacing={spacing}>
            {children}
          </Grid>
        </FormContent>
        
        {actions && (
          <FormActions>
            {actions}
          </FormActions>
        )}
      </Box>
    </FormProvider>
  );

  if (variant === 'plain') {
    return content;
  }

  return <FormContainer>{content}</FormContainer>;
}

export default Form;