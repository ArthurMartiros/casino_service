export interface IMSessionSpinNotification {
    Player_id: string;
    Game_id: string;
    Session_id: string;
    Spin_id: number;
    Bet_type: string;
    Bet_amount: number;
    Win_amount: number;
    Prize_amount: number;
    Balance_after: number;
    Time: Date;
}

export interface IMJackpotSetSlotsValue {
    Slots: IMSessionSpinNotification[];
}