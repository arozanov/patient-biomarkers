import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BiomarkerCharts } from './BiomarkerCharts';
import { makePatient, makeTestResult } from '../test-utils';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-container">{children}</div>
    ),
  };
});

describe('BiomarkerCharts', () => {
  it('shows a warning for biomarkers with mixed units across records', () => {
    const patient = makePatient(1, 'test123', {
      testResults: [
        makeTestResult(1, new Date('2024-01-01T00:00:00.000Z'), { creatineUnit: 'mgdl' }),
        makeTestResult(2, new Date('2024-02-01T00:00:00.000Z'), { creatineUnit: 'umoll' }),
      ],
    });

    render(<BiomarkerCharts patient={patient} />);

    expect(screen.getByText(/Mixed units across records/)).toBeInTheDocument();
  });

  it('renders the chart when all units match for a biomarker', () => {
    const patient = makePatient(1, 'test123', {
      testResults: [
        makeTestResult(1, new Date('2024-01-01T00:00:00.000Z')),
        makeTestResult(2, new Date('2024-02-01T00:00:00.000Z')),
      ],
    });

    render(<BiomarkerCharts patient={patient} />);

    expect(screen.queryByText(/Mixed units/)).not.toBeInTheDocument();
  });

  it('renders the empty state when patient has no test results', () => {
    const patient = makePatient(1, 'test123');

    render(<BiomarkerCharts patient={patient} />);

    expect(screen.getByText(/No test results for this patient/)).toBeInTheDocument();
  });
});
