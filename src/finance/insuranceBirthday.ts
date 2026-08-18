/**
 * Life Insurance & Birthday / Milestone Calculation Engine
 */

export interface LifeInsurancePolicy {
  id: string; // e.g. "INS-001"
  policyName: string; // e.g. "MetLife Guaranteed Savings Plan"
  insurer: string; // e.g. "MetLife Bangladesh", "Delta Life", "Pragati Life"
  policyNumber: string; // e.g. "POL-992014"
  sumAssured: number; // ৳ Death Benefit / Life Coverage
  premiumAmount: number; // ৳ per payment
  premiumFrequency: 'monthly' | 'quarterly' | 'half_yearly' | 'annual';
  policyTermYears: number; // e.g. 15 years
  premiumPayingTermYears: number; // e.g. 10 years
  paidPremiumsTotal: number; // ৳ paid to date
  projectedMaturityBonus: number; // ৳ estimated maturity payout
  startDate: string;
  nextPremiumDueDate: string;
  nomineeName: string;
  status: 'active' | 'lapsed' | 'matured';
}

export interface BirthdayEvent {
  id: string; // e.g. "BD-001"
  personName: string; // e.g. "Sarah (Spouse)", "Ayan (Son)"
  relation: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Friend' | 'Self' | 'Other';
  birthDate: string; // "YYYY-MM-DD" e.g. "1994-08-22"
  giftBudget: number; // ৳
  customGreetingMessage?: string;
  notifyDaysBefore: number; // e.g. 3 days before
}

export interface InsuranceSummary {
  totalLifeCoverage: number; // Total Sum Assured
  totalAnnualPremiums: number; // Total yearly premium commitment
  totalPremiumsPaidToDate: number;
  projectedTotalMaturityValue: number;
  coverageToDebtRatioPct: number; // (Total Life Coverage / Total Debt) * 100
  policiesCount: number;
  nextDuePolicy: {
    policy: LifeInsurancePolicy;
    daysRemaining: number;
  } | null;
}

export interface BirthdayReminderSummary {
  personName: string;
  relation: string;
  nextBirthdayFormatted: string;
  daysRemaining: number;
  turningAge: number;
  giftBudget: number;
  greetingText: string;
  urgency: 'critical' | 'warning' | 'safe';
}

/**
 * Calculates Life Insurance metrics
 */
export const calculateInsuranceSummary = (
  policies: LifeInsurancePolicy[],
  totalLoans: number = 1
): InsuranceSummary => {
  const activePolicies = policies.filter((p) => p.status === 'active');
  const totalLifeCoverage = activePolicies.reduce((sum, p) => sum + p.sumAssured, 0);
  const totalPremiumsPaidToDate = activePolicies.reduce((sum, p) => sum + p.paidPremiumsTotal, 0);
  const projectedTotalMaturityValue = activePolicies.reduce(
    (sum, p) => sum + p.sumAssured + p.projectedMaturityBonus,
    0
  );

  // Annualized Premium Commitment
  const totalAnnualPremiums = activePolicies.reduce((sum, p) => {
    let multiplier = 1;
    if (p.premiumFrequency === 'monthly') multiplier = 12;
    if (p.premiumFrequency === 'quarterly') multiplier = 4;
    if (p.premiumFrequency === 'half_yearly') multiplier = 2;
    return sum + p.premiumAmount * multiplier;
  }, 0);

  const safeDebt = totalLoans > 0 ? totalLoans : 1;
  const coverageToDebtRatioPct = Number(((totalLifeCoverage / safeDebt) * 100).toFixed(0));

  // Find next upcoming premium due
  let nextDuePolicy: InsuranceSummary['nextDuePolicy'] = null;
  if (activePolicies.length > 0) {
    const today = new Date();
    const sorted = [...activePolicies].sort((a, b) => {
      const diffA = new Date(a.nextPremiumDueDate).getTime() - today.getTime();
      const diffB = new Date(b.nextPremiumDueDate).getTime() - today.getTime();
      return diffA - diffB;
    });

    const nextP = sorted[0];
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(nextP.nextPremiumDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );

    nextDuePolicy = {
      policy: nextP,
      daysRemaining,
    };
  }

  return {
    totalLifeCoverage,
    totalAnnualPremiums,
    totalPremiumsPaidToDate,
    projectedTotalMaturityValue,
    coverageToDebtRatioPct,
    policiesCount: activePolicies.length,
    nextDuePolicy,
  };
};

/**
 * Calculates Birthday countdowns, ages, and greetings
 */
export const calculateBirthdayReminders = (
  birthdays: BirthdayEvent[]
): BirthdayReminderSummary[] => {
  const today = new Date();
  const currentYear = today.getFullYear();

  return birthdays
    .map((b) => {
      const [bYear, bMonth, bDay] = b.birthDate.split('-').map(Number);
      let nextBDate = new Date(currentYear, bMonth - 1, bDay);

      // If birthday has already passed this year, set to next year
      if (nextBDate.getTime() < today.getTime() - 1000 * 60 * 60 * 24) {
        nextBDate = new Date(currentYear + 1, bMonth - 1, bDay);
      }

      const diffTime = nextBDate.getTime() - today.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const turningAge = nextBDate.getFullYear() - bYear;

      let urgency: 'critical' | 'warning' | 'safe' = 'safe';
      if (daysRemaining <= 7) urgency = 'critical';
      else if (daysRemaining <= 30) urgency = 'warning';

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const nextBirthdayFormatted = `${bDay} ${months[bMonth - 1]} (${nextBDate.getFullYear()})`;

      const greetingText =
        b.customGreetingMessage ||
        `Wishing the happiest birthday to my wonderful ${b.relation.toLowerCase()}, ${b.personName}! 🎉 May your ${turningAge}th year be filled with health, joy, and boundless blessings! 🎂✨`;

      return {
        personName: b.personName,
        relation: b.relation,
        nextBirthdayFormatted,
        daysRemaining,
        turningAge,
        giftBudget: b.giftBudget,
        greetingText,
        urgency,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};
