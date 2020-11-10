import { CasinoProviderTranslation } from "../models/casino_provider_translation.model";
import { DEFAULT_LANGUAGE } from "../../../../../CommonJS/src/domain/constant";
import { map } from "bluebird";
import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { WebsiteCasinoModel } from "../../website_casino/models/website_casino.model";

export class CasinoProviderService extends ServiceWithRequestInfo {
    public async find(data: CasinoProviderService) {
        const providers = await CasinoProviderTranslation.manyOrNone(`
        select distinct
            def.provider_id, 
            ${data.lang_id} as lang_id,
            coalesce(tar.name, def.name) as name
        from ${CasinoProviderTranslation.tableName} as def
        left join ${CasinoProviderTranslation.tableName} as tar 
            on def.provider_id = tar.provider_id and tar.lang_id = ${data.lang_id || DEFAULT_LANGUAGE}
            ${this.isAdminRequest ? `` : `join ${WebsiteCasinoModel.tableName} as wc on wc.casino_id = def.provider_id`}
        where def.lang_id = ${DEFAULT_LANGUAGE}`);
        if (providers.length < 2) return [];
        return providers;
    }

    public async update(data: CasinoProviderTranslation[]) {
        return map(data, async provider => {
            const old = await CasinoProviderTranslation.findOne({ provider_id: provider.provider_id, lang_id: provider.lang_id });
            if (old) old.update(new CasinoProviderTranslation(provider));
            return new CasinoProviderTranslation(provider).saveWithID();
        });
    }
}
