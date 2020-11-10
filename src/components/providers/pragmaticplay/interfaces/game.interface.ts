export interface CasinoGame {
    gameID: string;
    gameName: string;
    gameTypeID: string;
    typeDescription: string;
    technology: string;
    technologyID: string;
    platform: string;
    demoGameAvailable: boolean;
    gameIdNumeric: string | number;
    frbAvailable?: boolean;
    variableFrbAvailable?: boolean;
}

export interface CasinoGameRequest {
    secureLogin: string;
    options?: string;
    hash: string;
}

export interface CasinoGameResponse {
    gameList: CasinoGame[];
    error: string;
    description: string;
}