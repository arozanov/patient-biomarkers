import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddDataForm } from './AddDataForm';
import { makePatient } from '../test-utils';

const mockMutate = vi.fn();
let mockMutationState = {
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null as Error | null,
};

vi.mock('../trpc', () => ({
  trpc: {
    patient: {
      addData: {
        useMutation: ({ onSuccess }: { onSuccess?: () => void } = {}) => ({
          mutate: (input: unknown) => {
            mockMutate(input);
            onSuccess?.();
          },
          ...mockMutationState,
        }),
      },
    },
  },
}));

describe('AddDataForm', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockMutationState = { isPending: false, isSuccess: false, isError: false, error: null };
  });

  it('locks demographics when clientId matches an existing patient', async () => {
    const user = userEvent.setup();
    render(<AddDataForm patients={[makePatient(1, 'existing_123')]} onSuccess={() => {}} />);

    await user.type(screen.getByLabelText('Patient ID'), 'existing_123');

    expect(screen.getByLabelText('Birthdate')).toBeDisabled();
    expect(screen.getByLabelText('Gender')).toBeDisabled();
    expect(screen.getByLabelText('Ethnicity')).toBeDisabled();
    expect(screen.getByText(/demographics are locked/i)).toBeInTheDocument();
  });

  it('keeps demographics editable for a brand new clientId', async () => {
    const user = userEvent.setup();
    render(<AddDataForm patients={[makePatient(1, 'existing_123')]} onSuccess={() => {}} />);

    await user.type(screen.getByLabelText('Patient ID'), 'brand_new');

    expect(screen.getByLabelText('Birthdate')).not.toBeDisabled();
    expect(screen.getByLabelText('Gender')).not.toBeDisabled();
    expect(screen.queryByText(/demographics are locked/i)).not.toBeInTheDocument();
  });

  it('fills demographics when a patient is picked from the dropdown', async () => {
    const user = userEvent.setup();
    render(<AddDataForm patients={[makePatient(1, 'existing_456', { gender: 2, ethnicity: 3 })]} onSuccess={() => {}} />);

    await user.selectOptions(screen.getByLabelText('Select existing patient'), 'existing_456');

    expect(screen.getByLabelText('Patient ID')).toHaveValue('existing_456');
    expect(screen.getByLabelText('Birthdate')).toHaveValue('1980-01-01');
    expect(screen.getByLabelText('Gender')).toHaveValue('2');
    expect(screen.getByLabelText('Ethnicity')).toHaveValue('3');
  });

  it('does not render the dropdown when there are no patients', () => {
    render(<AddDataForm patients={[]} onSuccess={() => {}} />);

    expect(screen.queryByLabelText('Select existing patient')).not.toBeInTheDocument();
  });

  it('submits the form with numeric values parsed from string inputs', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    render(<AddDataForm patients={[]} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText('Patient ID'), 'new_pt');
    await user.type(screen.getByLabelText('Test Date'), '2024-06-15');
    await user.type(screen.getByLabelText('Birthdate'), '1990-05-13');
    await user.type(screen.getByLabelText('Creatine'), '1.31');
    await user.type(screen.getByLabelText('Chloride'), '100');
    await user.type(screen.getByLabelText('Fasting Glucose'), '90');
    await user.type(screen.getByLabelText('Potassium'), '4.5');
    await user.type(screen.getByLabelText('Sodium'), '140');
    await user.type(screen.getByLabelText('Total Calcium'), '9.5');
    await user.type(screen.getByLabelText('Total Protein'), '7');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'new_pt',
        dateTesting: '2024-06-15',
        birthdate: '1990-05-13',
        gender: 1,
        ethnicity: 1,
        creatine: 1.31,
        chloride: 100,
        sodium: 140,
      }),
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('clears test date and biomarker values after successful save', async () => {
    const user = userEvent.setup();
    render(<AddDataForm patients={[]} onSuccess={() => {}} />);

    await user.type(screen.getByLabelText('Patient ID'), 'new_pt');
    await user.type(screen.getByLabelText('Test Date'), '2024-06-15');
    await user.type(screen.getByLabelText('Birthdate'), '1990-05-13');
    await user.type(screen.getByLabelText('Creatine'), '1.31');
    await user.type(screen.getByLabelText('Chloride'), '100');
    await user.type(screen.getByLabelText('Fasting Glucose'), '90');
    await user.type(screen.getByLabelText('Potassium'), '4.5');
    await user.type(screen.getByLabelText('Sodium'), '140');
    await user.type(screen.getByLabelText('Total Calcium'), '9.5');
    await user.type(screen.getByLabelText('Total Protein'), '7');
    await user.click(screen.getByRole('button', { name: /Save/ }));

    expect(screen.getByLabelText('Patient ID')).toHaveValue('new_pt');
    expect(screen.getByLabelText('Birthdate')).toHaveValue('1990-05-13');
    expect(screen.getByLabelText('Test Date')).toHaveValue('');
    expect(screen.getByLabelText('Creatine')).toHaveValue(null);
    expect(screen.getByLabelText('Sodium')).toHaveValue(null);
  });
});
