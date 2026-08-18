/**
 * Wealth Velocity & Time Value of Life Engine
 * Calculates income, burn rate, and savings rates broken down to
 * Year, Month, Day, Hour, and Minute based on Birthday and Lifetime Cash Flow.
 */

export interface LifeTimeWealthVelocity {
  birthDate: string;
  ageYears: number;
  ageDays: number;
  totalMinutesLived: number;
  totalHoursLived: number;
  careerYears: number;

  // Real-Time Velocity Rates
  income: {
    perYear: number;
    perMonth: number;
    perDay: number;
    perHour: number;
    perHourWorking: number; // 8-hour workday
    perMinute: number;
  };

  expense: {
    perYear: number;
    perMonth: number;
    perDay: number;
    perHour: number;
    perMinute: number;
  };

  savings: {
    perYear: number;
    perMonth: number;
    perDay: number;
    perHour: number;
    perMinute: number;
    savingsRatePct: number;
  };

  // Lifetime Cumulative Capital
  lifetime: {
    estimatedLifetimeEarnings: number;
    estimatedLifetimeSpending: number;
    lifetimeNetWealthAccumulated: number;
    wealthGeneratedPerHourLived: number;
  };
}

export const calculateWealthVelocity = (
  birthDateString: string = '1992-05-15',
  monthlyIncome: number = 238500,
  monthlyExpense: number = 102500,
  netWorth: number = 53075000
): LifeTimeWealthVelocity => {
  const birthDate = new Date(birthDateString);
  const now = new Date();

  const diffMs = now.getTime() - birthDate.getTime();
  const ageDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const ageYears = Number((ageDays / 365.25).toFixed(1));
  const totalHoursLived = ageDays * 24;
  const totalMinutesLived = totalHoursLived * 60;

  // Assume career starts at age 22
  const careerYears = Math.max(1, Number((ageYears - 22).toFixed(1)));

  // Income Velocities
  const annualIncome = monthlyIncome * 12;
  const dailyIncome = Number((annualIncome / 365.25).toFixed(2));
  const hourlyIncome = Number((dailyIncome / 24).toFixed(2));
  const workingHourlyIncome = Number((annualIncome / (52 * 5 * 8)).toFixed(2)); // 40h/wk
  const minuteIncome = Number((dailyIncome / (24 * 60)).toFixed(2));

  // Expense Velocities
  const annualExpense = monthlyExpense * 12;
  const dailyExpense = Number((annualExpense / 365.25).toFixed(2));
  const hourlyExpense = Number((dailyExpense / 24).toFixed(2));
  const minuteExpense = Number((dailyExpense / (24 * 60)).toFixed(2));

  // Savings / Equity Velocity
  const monthlySavings = monthlyIncome - monthlyExpense;
  const annualSavings = monthlySavings * 12;
  const dailySavings = Number((annualSavings / 365.25).toFixed(2));
  const hourlySavings = Number((dailySavings / 24).toFixed(2));
  const minuteSavings = Number((dailySavings / (24 * 60)).toFixed(2));
  const savingsRatePct = Number(((monthlySavings / (monthlyIncome || 1)) * 100).toFixed(1));

  // Lifetime Estimates (Career average modeled with conservative inflation ramp)
  const avgCareerMonthlyIncome = monthlyIncome * 0.65;
  const estimatedLifetimeEarnings = Math.round(avgCareerMonthlyIncome * 12 * careerYears);
  const estimatedLifetimeSpending = Math.round(monthlyExpense * 0.7 * 12 * careerYears);
  const wealthGeneratedPerHourLived = Number((netWorth / (totalHoursLived || 1)).toFixed(2));

  return {
    birthDate: birthDateString,
    ageYears,
    ageDays,
    totalMinutesLived,
    totalHoursLived,
    careerYears,
    income: {
      perYear: Math.round(annualIncome),
      perMonth: Math.round(monthlyIncome),
      perDay: dailyIncome,
      perHour: hourlyIncome,
      perHourWorking: workingHourlyIncome,
      perMinute: minuteIncome,
    },
    expense: {
      perYear: Math.round(annualExpense),
      perMonth: Math.round(monthlyExpense),
      perDay: dailyExpense,
      perHour: hourlyExpense,
      perMinute: minuteExpense,
    },
    savings: {
      perYear: Math.round(annualSavings),
      perMonth: Math.round(monthlySavings),
      perDay: dailySavings,
      perHour: hourlySavings,
      perMinute: minuteSavings,
      savingsRatePct,
    },
    lifetime: {
      estimatedLifetimeEarnings,
      estimatedLifetimeSpending,
      lifetimeNetWealthAccumulated: netWorth,
      wealthGeneratedPerHourLived,
    },
  };
};
