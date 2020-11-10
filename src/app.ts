/**
 * Created by Georgi on 3/10/2017.
 */

import { QueueType } from "../../CommonJS/src/messaging/QueueType";
import { MessageHandler } from "./messaging/MessageHandler";
import { BaseModel, broker } from "../../CommonJS/src/base/base.model";
import { CONFIG } from "../../CommonJS/src/utils/utils";
import { v4 } from "uuid";
import { CasinoStatisticsService } from "./components/casino_statistics/services/casino_statistics.service";
import { scheduleJob } from "node-schedule";
import { CasinoService } from "./components/casino/services/casino.service";
import { CasinoExtraSpinService } from "./components/casino_extra_spin/services/casino_extra_spin.service";
import { BonusWalletService } from "./components/bonus_wallet/services/bonus_wallet.service";
// import { CashBackService } from "../src/components/cashback/services/cash_back.service";

const casinoStatisticsService = new CasinoStatisticsService();

class Server {
    constructor() {
        this.initBroker();
        this.initDB();
        this.initJobs();
    }

    private async initBroker() {
        await broker.init();
        let queueName = QueueType.CASINO_SERVICE;
        //setup queue for being able to reply to exactly this service requests
        let callbackQueue = queueName + "-" + v4();
        broker.declareQueue(callbackQueue, { autoDelete: true });
        broker.callbackQueue = callbackQueue;
        new MessageHandler(broker, callbackQueue, false);
        //get messages from message broker
        new MessageHandler(broker, queueName);
    }

    private initDB() {
        BaseModel.db_config = CONFIG().Databases.Casino.postgres;
    }

    private initJobs() {
        // each minute
        scheduleJob("*/5 * * * *", () => casinoStatisticsService.calculateWinners());
        scheduleJob("*/1 * * * *", () => CasinoExtraSpinService.CloseOldSpins());
        scheduleJob("*/1 * * * *", () => BonusWalletService.CloseFinishedWallets());
        scheduleJob("*/1 * * * *", () => BonusWalletService.CloseOldWallets());
        // scheduleJob("*/1 * * * *", () => CashBackService.CashBackProcess());
        // scheduleJob("*/1 * * * *", () => CashBackService.CashOut());
        const utc = new Date();
        utc.setUTCHours(0, 0, 1, 0);
        scheduleJob({ hour: utc.getHours(), minute: utc.getMinutes(), second: utc.getSeconds() }, () => CasinoService.SendGGR());
    }
}

new Server();
