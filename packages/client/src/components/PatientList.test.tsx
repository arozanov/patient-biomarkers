import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientList } from './PatientList';
import { makePatient, makeTestResult } from '../test-utils';

describe('PatientList', () => {
  it('renders the loading state', () => {
    render(<PatientList patients={[]} selectedId={null} onSelect={() => {}} isLoading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the empty state when no patients', () => {
    render(<PatientList patients={[]} selectedId={null} onSelect={() => {}} isLoading={false} />);

    expect(screen.getByText('No patients loaded')).toBeInTheDocument();
  });

  it('shows M for gender 1, F for gender 2, and ? for anything else', () => {
    const patients = [
      makePatient(1, 'a', { gender: 1 }),
      makePatient(2, 'b', { gender: 2 }),
      makePatient(3, 'c', { gender: 99 }),
    ];
    render(<PatientList patients={patients} selectedId={null} onSelect={() => {}} isLoading={false} />);

    expect(screen.getByText(/Born: Jan 1, 1980 \/ M/)).toBeInTheDocument();
    expect(screen.getByText(/Born: Jan 1, 1980 \/ F/)).toBeInTheDocument();
    expect(screen.getByText(/Born: Jan 1, 1980 \/ \?/)).toBeInTheDocument();
  });

  it('pluralizes result count correctly', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const patients = [
      makePatient(1, 'one', { testResults: [makeTestResult(1, date)] }),
      makePatient(2, 'many', {
        testResults: [makeTestResult(1, date), makeTestResult(2, date), makeTestResult(3, date)],
      }),
      makePatient(3, 'zero'),
    ];
    render(<PatientList patients={patients} selectedId={null} onSelect={() => {}} isLoading={false} />);

    expect(screen.getByText('1 result')).toBeInTheDocument();
    expect(screen.getByText('3 results')).toBeInTheDocument();
    expect(screen.getByText('0 results')).toBeInTheDocument();
  });

  it('calls onSelect with patient id when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <PatientList
        patients={[makePatient(42, 'clickable')]}
        selectedId={null}
        onSelect={onSelect}
        isLoading={false}
      />,
    );

    await user.click(screen.getByRole('button', { name: /clickable/ }));

    expect(onSelect).toHaveBeenCalledWith(42);
  });
});
