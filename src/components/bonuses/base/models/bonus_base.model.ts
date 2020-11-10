import { IBonus } from "../interfaces/bonus.interface";
import { BaseModelWithLogger } from "../../../../../../CommonJS/src/base/baseWithLoger.model";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export class BaseBonus extends BaseModelWithLogger implements IBonus {
    public id?: number;
    public name: string;
    public status_id: BonusStatus;
    public amount: number;
    public currency_id: number;
    public period?: number;
    public start_date?: Date;
    public end_date?: Date;
    public website_id: number;
    public days_to_expire: number;

    constructor(data: IBonus, source?: IUser) {
        super(source);
        this.id = data.id;
        this.name = data.name;
        this.status_id = data.status_id || BonusStatus.INACTIVE;
        this.amount = data.amount;
        this.currency_id = data.currency_id;
        this.period = data.period;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.website_id = data.website_id;
        this.days_to_expire = data.days_to_expire;
    }
}
