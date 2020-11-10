import { IEvoRequest, IEvoResponse } from "./evoplay.interface";

export interface IGetListRequest extends IEvoRequest {
    need_extra_data?: 0 | 1;
}

export interface IGetListResponse extends IEvoResponse {
    data?: {
        name: string;
        absolute_name: string;
        developer_id: number;
        type_id: number;
        mobile: number;
        fullstate: number;
        denominations_override_allowed: number;
        extra_bonuses_types: string[];
        languages: string[];
        baraban_width: number;
        baraban_height: number;
        min_lines_count: number;
        max_lines_count: number;
        default_payout: number;
        status: string;
        data;
    };
}

export interface IGetAvailablePayoutsResponse extends IEvoResponse {
    data?: number[];
}

export interface IGetDevelopersResponse extends IEvoResponse {
    data?: {
        [key: string]: string;
    };
}

export interface IGetTypesResponse extends IEvoResponse {
    data?: {
        [key: string]: string;
    };
}

export interface IGetAvailableBetsResponse extends IEvoResponse {
    data: {
        [key: string]: number[];
    };
}

export interface IGetGameInfoResponse extends IEvoResponse {
    data?: {
        game_id: number;
        absolute_name: string;
        title: string;
        fullstate: number;
        languages: string[];
        mobile: number;
        desktop: number;
        denominations: number[];
        bets: {
            [key: string]: number[];
        };
        denominations_override_allowed: string;
        extra_bonuses_types: {
            [key: string]: string;
        };
        lines_numbers: number[];
        available_freespins_count: number[];
    };
}

export interface IGetEventRequest extends IEvoRequest {
    event_id: string | number;
    format_code?: 1;
}

export interface IGetEventResponse extends IEvoResponse {
    // tslint:disable-next-line:no-any
    data?: any;
}

export interface IGetAvailableLanguagesResponse extends IEvoResponse {
    data?: string[];
}

export interface IGetRoundRequest extends IEvoRequest {
    event_id: string | number;
    format_code?: 1;
}

export interface IGetRoundResponse extends IEvoResponse {
    // tslint:disable-next-line:no-any
    data?: any;
}

export interface IGetUrlRequest extends IEvoRequest {
    token: string;
    settings: {
        exit_url?: string;
        cash_url?: string;
        language?: string;
        denominations?: number[];
        https?: 0 | 1;
        extra_bonuses: {
            bonus_spins?: {
                spins_count?: number;
                lines_count?: number;
                bet_in_money?: number;
                denomination?: number;
            };
            freespins_on_start?: {
                freespins_count?: number;
                lines_count?: number;
                bet_in_money?: number;
                denomination?: number;
            };
            extra_bonuses?: {
                user_id?: number;
                expire?: Date;
                payout?: number;
                registration_id?: number;
                bypass?: {
                    promoCode?: string;
                };
            };
        };
        extra_bonuses_settings?: {
            user_id?: string;
            expire?: string;
            payout?: number;
            registration_id?: string;
            bypass?: {
                promoCode: string;
            };
        };
        payout?: number;
        use_flash_loader?: 0 | 1;
    };
    denomination: number;
    currency: string;
    return_url_info: 0 | 1;
    callback_version: number;
    website_id: number;
    lang_id: number;
    exit_url: string;
    demo: boolean;
}

export interface IRegisterBonusRequest extends IEvoRequest {
    token: string;
    game: string | number;
    currency: string;
    extra_bonuses: {
        bonus_spins?: {
            spins_count?: number;
            lines_count?: number;
            bet?: number;
            denomination?: number;
            freespins_on_start?: {
                freespins_count?: number;
                lines_count?: number;
                bet?: number;
                denomination?: number;
            };
        };
    };
    settings?: {
        user_id?: number;
        expire?: Date;
        payout?: number;
        registration_id?: string;
        bypass?: {
            promoCode?: string;
        };
    };
}

export interface IRegisterBonusResponse extends IEvoResponse {
    // tslint:disable-next-line:no-any
    data?: any;
}
