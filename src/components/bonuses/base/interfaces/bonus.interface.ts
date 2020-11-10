import { IBaseWithLogger } from "../../../../../../CommonJS/src/base/base.interface";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export interface IBonus extends IBaseWithLogger {
    id?: number;
    name: string;
    status_id: BonusStatus;
    amount: number;
    currency_id: number;
    period?: number;
    start_date?: Date;
    end_date?: Date;
    website_id: number;
    days_to_expire: number; 
}

export interface IBaseBonusFilter {
    id?: number;
    name?: string;
    status_id?: BonusStatus;
    amount?: number;
    currency_id?: number;
    period?: number;
    start_date_from?: Date;
    start_date_to?: Date;
    end_date_from?: Date;
    end_date_to?: Date;
    sort_by?: string;
    sort_order?: string;
}
