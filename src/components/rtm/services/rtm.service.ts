import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { CasinoRtmFilter } from "../filters/casino.rtm.filter";
import { ICasinoRtmFilter } from "../interfaces/casino.rtm.model.interface";

export class RtmService extends ServiceWithRequestInfo {
    public async casinoRtmList(request: ICasinoRtmFilter) {
        request.unlimit = false;
        return new CasinoRtmFilter(request).findList();
    }

    public async casinoRtmToExport(data: ICasinoRtmFilter) {
        return new CasinoRtmFilter(data).findToCSV(data);
    }
}
