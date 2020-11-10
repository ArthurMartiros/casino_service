export enum SessionName {
    Init = "init",
    Bet = "bet",
    Win = "win",
    Refund = "refund",
    Start = "start",
    End = "end"
}

export enum ResponseStatus {
    Error = "error",
    Ok = "ok"
}

export enum ResponseScope {
    User = "user",
    Internal = "internal"
}

export enum ResponseNoRefund {
    No = 0,
    Yes = 1
}
