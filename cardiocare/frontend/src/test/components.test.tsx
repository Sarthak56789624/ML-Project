import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskGauge } from '../components/RiskGauge';
import { GlassCard } from '../components/GlassCard';
import { ContributingFactorsChart } from '../components/ContributingFactorsChart';
import type { ContributingFactor } from '../lib/api';

describe('RiskGauge Component', () => {
  it('renders probability percentage and High risk badge correctly', () => {
    render(<RiskGauge probability={0.785} riskLevel="High" />);
    expect(screen.getByText('78.5%')).toBeInTheDocument();
    expect(screen.getByText(/High Risk Tier/i)).toBeInTheDocument();
  });

  it('renders Low risk tier correctly', () => {
    render(<RiskGauge probability={0.152} riskLevel="Low" />);
    expect(screen.getByText('15.2%')).toBeInTheDocument();
    expect(screen.getByText(/Low Risk Tier/i)).toBeInTheDocument();
  });
});

describe('GlassCard Component', () => {
  it('renders children and preserves custom classes', () => {
    render(
      <GlassCard className="test-card-custom" glowColor="teal">
        <p>Clinical Intelligence Test</p>
      </GlassCard>
    );
    expect(screen.getByText('Clinical Intelligence Test')).toBeInTheDocument();
  });
});

describe('ContributingFactorsChart Component', () => {
  it('renders feature names, observed values, and human readable text', () => {
    const mockFactors: ContributingFactor[] = [
      {
        feature: 'BP_History',
        display_name: 'Blood Pressure History',
        value: 'Hypertension',
        signed_contribution: 0.28,
        impact: 'increases_risk',
        human_readable: 'Established marker of continued high risk.',
      },
      {
        feature: 'Salt_Intake',
        display_name: 'Salt Intake',
        value: 12.0,
        signed_contribution: 0.05,
        impact: 'increases_risk',
        human_readable: 'Excess sodium expands intravascular fluid.',
      },
    ];

    render(<ContributingFactorsChart factors={mockFactors} />);
    expect(screen.getByText('Blood Pressure History')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
    expect(screen.getByText('+28.0%')).toBeInTheDocument();
    expect(screen.getByText(/Established marker of continued high risk/i)).toBeInTheDocument();
  });
});
