export interface IUserFinancialModel {
  profitability: number;
  profitability_grade: number;
  open_bets_amount: number;
  open_bets_sum: number;
  payout: number;
  stake_amount: number;
  stake_count: number;
}

export interface IUserFinancialFilter {
  userId: number;
}

export interface ICalculatedUserProfit {
  profitability: number;
  profitability_grade: number;
}

export interface IUserFinancialSupportQuery {
  stake: number;
  status_id: number;
}
