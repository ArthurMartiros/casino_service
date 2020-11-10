import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { CasinoWinner } from "../models/casino_winner.model";
import { redis } from "../../../../../CacheService/src/utils/cache";
import { SubjectType } from "../../../../../SocketService/src/base/enums/subject_type.enum";
import { reduce } from "bluebird";
import { MaskEmail } from "../../../../../CommonJS/src/utils/utils";
import { isEmail } from "validator";
import { ActionType } from "../../../../../SocketService/src/base/interfaces/observer.interface";
import { uniqBy, cloneDeep } from "lodash";
import { CasinoGameFilter } from "../../casino_game/filters/casino_game.filter";
import { ICasinoWinner } from '../interfaces/casino_winner.interface';

export class CasinoStatisticsService extends ServiceWithRequestInfo {
    public async calculateWinners(): Promise<void> {
        const oldModels = await this.getWinnersList();
        await CasinoWinner.oneOrNone("REFRESH MATERIALIZED VIEW casino_winner");
        const models = await this.getWinnersList();

        // check if data is equal
        if (JSON.stringify(oldModels) === JSON.stringify(models)) return;
        
        // if data is not same send update
        await redis.publish(
            JSON.stringify({
                type: SubjectType.UPDATE_WINNERS
            }),
            JSON.stringify({
                actionType: ActionType.UPDATE,
                actionData: models
            })
        );
    }

    public async getWinnersList() {
        const requestInfo = cloneDeep(this.requestInfo);
        const query = QueryBuilder(`casino_winner`).orderByRaw(`won_amount desc`);

        let models = await CasinoWinner.manyOrNone(query);

        models = uniqBy(models, "casino_game_id");

        const games = await CasinoGameFilter.findAllByFilter({
            ids: models.map(m => m.casino_game_id),
            unlimit: true,
            ...requestInfo,
            is_admin: false
        });

        return reduce(
            models,
            async (result: ICasinoWinner[], model) => {
                if (isEmail(model.user_name)) model.user_name = MaskEmail(model.user_name);
                const game = games.find(g => g.id == model.casino_game_id);
                if (!game) return result;
                model.thumb_url = game.image_sm_url || game.image_md_url || game.image_lg_url || "";
                model.name = game.name;
                result.push(model);
                return result;
            },
            []
        );
    }
   
}
