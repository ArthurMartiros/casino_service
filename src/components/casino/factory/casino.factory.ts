import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { Evoplay } from "../../providers/evoplay/services/evoplay.service";
import { CasinoID } from "../enums/casino.enum";
import { ICasinoProvider } from "../interfaces/casino.interface";
import { toNumber } from "lodash";
import { Slotegrator } from "../../providers/slotegrator/services/slotegrator.service";
import { Gamshy } from "../../providers/gamshy/services/gamshy.service";
import { Mascot } from "../../providers/mascot/services/mascot.service";
import { Pragmatic } from "../../providers/pragmaticplay/services/pragmatic.service";
import { B2BSlots } from "../../providers/b2b_slots/services/b2b.service";

export function CasinoProvider(id: number): ICasinoProvider {
    switch (toNumber(id)) {
        case CasinoID.EVOPLAY:
            return new Evoplay();
        case CasinoID.SLOTEGRATOR_AMATIC:
        case CasinoID.SLOTEGRATOR_BETGAMES:
        case CasinoID.SLOTEGRATOR_BETSOFT:
        case CasinoID.SLOTEGRATOR_BIG_TIME_GAMING:
        case CasinoID.SLOTEGRATOR_BOOONGO:
        case CasinoID.SLOTEGRATOR_DLV:
        case CasinoID.SLOTEGRATOR_ENDORPHINA:
        case CasinoID.SLOTEGRATOR_GAMEART:
        case CasinoID.SLOTEGRATOR_HABANERO:
        case CasinoID.SLOTEGRATOR_IGROSOFT:
        case CasinoID.SLOTEGRATOR_MICROGAMING:
        case CasinoID.SLOTEGRATOR_PLATIPUS:
        case CasinoID.SLOTEGRATOR_PLAYSON:
        case CasinoID.SLOTEGRATOR_REDRAKE:
        case CasinoID.SLOTEGRATOR_SPINOMENAL:
        case CasinoID.SLOTEGRATOR_TOMHORN:
        case CasinoID.SLOTEGRATOR_VIVOGAMING:
            return new Slotegrator();
        case CasinoID.GAMSHY:
            return new Gamshy();
        case CasinoID.MASCOT:
            return new Mascot();
        case CasinoID.PRAGMATIC:
            return new Pragmatic();
        case CasinoID.B2BSLOTS:
            return new B2BSlots();
        default:
            throw ErrorUtil.newError(ErrorCodes.UNKNOWN_PROVIDER);
    }
}
