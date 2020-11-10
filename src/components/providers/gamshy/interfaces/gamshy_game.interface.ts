import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";

export interface IGamshyStartGame {
    casino_game_id: number;
    user: IUser;
    api_id: string;
    api_key: string;
    token: string;
    channel_id: number;
    website_id: number;
    demo: boolean;
    currency: string;
    casinoGame: any;
}

export interface IGamshyCustomState {
    customState: {
        session_id: string;
        roundId?: string
    }
}

export interface IGamshyStartGameRequest {
    casino_game_id: number;
    user: IUser;
    api_id: string;
    api_key: string;
    token: string;
    demo: boolean;
    ip: string
}

export interface IGamshyGame {
    id: string;
    description: string;
    hasFunMode: boolean;
}

export interface IGamshyLoginCallback extends IGamshyCustomState {
    game: {
        id: number;
        sessionId: string
    };
    operator: {
        id: number
    };
    user: {
        id: string
    };
    wallet: {
        currencyIsoCode: string
    }
}

export interface IGamshyWithdrawCallback extends IGamshyCustomState {
    game: {
        sessionId: string;
        transactionId: string;
        roundId: string;
        roundCount: number;
        roundPhaseId: string;
        roundPhaseCount: number;
        isRoundComplete: boolean
    };
    wallet: {
        withdrawal: number;
    }
}
export interface IGamshyDepositCallback extends IGamshyCustomState {
    game: {
        sessionId: string;
        transactionId: string;
        roundId: string;
        roundCount: number;
        roundPhaseId: string;
        roundPhaseCount: number;
        isRoundComplete: boolean
    };
    wallet: {
        deposit: number;
    }
}
export interface IGamshyLogoutCallback extends IGamshyCustomState {
    game: {
        sessionId: string;
        isLastRoundIncomplete: boolean
    };
    statistics: {
        deposit: number;
        sessionDuration: number;
        cashWithdrawal: number;
        bonusWithdrawal: number;
        cashDeposit: number;
        bonusDeposit: number;
        roundCount: number;
        roundPhaseCount: number
    }
}

export interface IGamshyRollbackCallback extends IGamshyCustomState {
    game: {
        sessionId: string;
        transactionId: string
    }
}

export interface IGamshyCallbackResponse {
    wallet: {
        cash: number;
        bonus?: number
        bonusWithdrawn?: number
    };
    statistics?: {
        message: string,
        showContinueButton: boolean;
        showQuitButton: boolean;
        showLogsButton: boolean
    };
    authority?: {
        sessionId: string;
        userTicket?: string
    };
    customState?: {
        roundId: string
    }
}

export interface IGamshyError {
    error_code: string;
    error_description: string;
}