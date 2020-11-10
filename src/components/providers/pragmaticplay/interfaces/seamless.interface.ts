// Base request and response interfaces

interface Request {
    hash: string;
    providerId: string;
    method: string;
}

interface UserRequest extends Request {
    userId: number;
}

interface Token {
    token: string;
}

interface MoneyResponse {
    cash: number;
    bonus: number;
}

interface ExtendedMoneyResponse extends MoneyResponse {
    currency: string;
}

interface TransactionResponse extends ExtendedMoneyResponse {
    transactionId: number;
}

interface GameInfo {
    gameId: string;
    roundId: string;
}

interface GameInfoOptional {
    gameId?: string;
    roundId?: string;
}

interface Timestamp {
    timestamp: number;
}

interface TimestampOptional {
    timestamp?: number;
}

interface Platform {
    platform?: string;
}

interface Amount {
    amount: number;
}

interface AmountOptional {
    amount?: number;
}

interface Reference {
    reference: string;
}

// Authenticate
export interface AuthRequest extends Request, Token {
    gameId?: string;
    ipAddress?: string;
}

export interface AuthResponse {
    userId: number;
    currency: string;
    cash: number;
    bonus: number;
    token?: string;
    country?: string;
    jurisdiction?: string;
    betLimits?: BetLimits;
    error: number;
    description: string;
}

interface BetLimits {
    defaultBet: number;
    minBet: number;
    maxBet: number;
    maxTotalBet: number;
    minTotalBet: number;
}

// Balance
export interface BalanceRequest extends UserRequest, Token {}

export interface BalanceResponse extends ExtendedMoneyResponse {}

// Bet
export interface BetRequest extends UserRequest, Token, GameInfo, Timestamp, Platform, Amount, Reference {
    roundDetails: string;
    bonusCode?: string;
    language?: string;
    jackpotContribution?: number;
    jackpotId?: string;
    ipAddress?: string;
}

export interface BetResponse extends TransactionResponse {
    usedPromo: number;
}

// Result
export interface ResultRequest extends UserRequest, Token, GameInfo, Timestamp, Platform, Amount, Reference {
    roundDetails: string;
    bonusCode?: string;
    promoWinAmount?: number;
    promoWinReference?: string;
    promoCampaignID?: string | number;
    promoCampaignType?: string;
}

export interface ResultResponse extends TransactionResponse {}

// BonusWin
export interface BonusWinRequest extends UserRequest, Token, GameInfo, Timestamp, Amount, Reference {
    bonusCode?: string;
}

export interface BonusWinResponse extends TransactionResponse {}

// JackpotWin
export interface JackpotWinRequest extends UserRequest, Token, GameInfo, Timestamp, Platform, Amount, Reference {
    jackpotId: string;
}

export interface JackpotWinResponse extends TransactionResponse {}

// EndRound
export interface EndRoundRequest extends UserRequest, Token, GameInfo, Platform {}

export interface EndRoundResponse extends MoneyResponse {}

// Refund
export interface RefundRequest extends UserRequest, Token, Reference, Platform, GameInfoOptional, AmountOptional, TimestampOptional {
    roundDetails?: string;
    bonusCode?: string;
}

export interface RefundResponse {
    transactionId: number | string | undefined;
    error?: number;
}

// Withdraw
export interface WithdrawRequest extends UserRequest {}

export interface WithdrawResponse extends ExtendedMoneyResponse {
    userId: number;
}

// GetBalancePerGame
export interface GetBalancePerGameResponse extends UserRequest, Token, Platform {
    gameIdList: string;
}

export interface GetBalancePerGameResponse {
    gamesBalances: GameBalance[];
}

interface GameBalance extends MoneyResponse {
    gameID: string;
}

// PromoWin
export interface PromoWinRequest extends UserRequest, Timestamp, Amount, Reference {
    currency: string;
    campaignId: string;
    campaignType: string;
}

export interface PromoWinResponse extends TransactionResponse {}
