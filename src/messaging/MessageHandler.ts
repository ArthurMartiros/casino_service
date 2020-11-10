/**
 * Created by Georgi on 3/4/2017.
 */
import { CommunicationCodes } from "../../../CommonJS/src/messaging/CommunicationCodes";
import { MessageHandlerBase } from "../../../CommonJS/src/messaging/MessageHandlerBase";
import { IMessage } from "../../../CommonJS/src/messaging/message.interface";
import { CasinoService } from "../components/casino/services/casino.service";
import { WebsiteCasinoService } from "../components/website_casino/services/website_casino.service";
import { CasinoGameService } from "../components/casino_game/services/casino_game.service";
import { CasinoGamesTranslationService } from "../components/casino_game_translation/services/casino_games_translation.service";
import { CasinoGameOrderService } from "../components/casino_game_order/services/casino_game_order.service";
import { CasinoCategoryService } from "../components/casino_category/services/casino_category.service";
import { CasinoCategoryTranslationService } from "../components/casino_category_translation/services/casino_category_translation.service";
import { CasinoHistoryService } from "../components/casino_history/services/casino_history.service";
import { CasinoStatisticsService } from "../components/casino_statistics/services/casino_statistics.service";
import { CasinoExtraSpinService } from "../components/casino_extra_spin/services/casino_extra_spin.service";
import { RegFreeSpinBonusService } from "../components/bonuses/reg_free_spin/services/reg_free_spin.service";
import { toBoolean } from "../../../CommonJS/src/utils/validators";
import { RtmService } from "../components/rtm/services/rtm.service";
import { Evoplay } from "../components/providers/evoplay/services/evoplay.service";
import { Slotegrator } from "../components/providers/slotegrator/services/slotegrator.service";
import { Gamshy } from "../components/providers/gamshy/services/gamshy.service";
import { ICasinoProvider } from "../components/casino/interfaces/casino.interface";
import { CasinoProviderService } from "../components/casino_provider_translation/services/casino_provider.service";
import { UserFinancialService } from "../components/user_financial/services/user.financial.service";
import { Mascot } from "../components/providers/mascot/services/mascot.service";
import { BonusWalletService } from "../components/bonus_wallet/services/bonus_wallet.service";
import { Pragmatic } from "../components/providers/pragmaticplay/services/pragmatic.service";
import { CashBackFilter, CashBackableUsersFilter } from "../components/cashback/filters/cash_back.filter";
import { CashBackService } from "../components/cashback/services/cash_back.service";
import { CashBackableUser } from "../components/cashback/models/cash_back.model";
import { B2BSlots } from '../components/providers/b2b_slots/services/b2b.service';

const casinoService = new CasinoService();
const websiteCasinoService = new WebsiteCasinoService();
const casinoGameService = new CasinoGameService();
const casinoGamesTranslationService = new CasinoGamesTranslationService();
const casinoGameOrderService = new CasinoGameOrderService();
const casinoCategoryService = new CasinoCategoryService();
const casinoCategoryTranslation = new CasinoCategoryTranslationService();
const casinoHistoryService = new CasinoHistoryService();
const casinoStatisticsService = new CasinoStatisticsService();
const casinoExtraFreeSpinService = new CasinoExtraSpinService();
const regFreeSpinBonusService = new RegFreeSpinBonusService();
const rtmService = new RtmService();
const evoplayService: ICasinoProvider = new Evoplay();
const slotegratorService: ICasinoProvider = new Slotegrator();
const gamshyService: ICasinoProvider = new Gamshy();
const mascotService: ICasinoProvider = new Mascot();
const pragmaticService: ICasinoProvider = new Pragmatic();
const userFinancialService = new UserFinancialService();
const casinoProviderService = new CasinoProviderService();
const bonusWalletService = new BonusWalletService();
const b2bSlotsService: ICasinoProvider = new B2BSlots();

export class MessageHandler extends MessageHandlerBase {
    protected async handleMessage(message: IMessage): Promise<{} | void> {
        rtmService.setRequestInfo(message);
        casinoService.setRequestInfo(message);
        casinoGameService.setRequestInfo(message);
        casinoGamesTranslationService.setRequestInfo(message);
        casinoCategoryService.setRequestInfo(message);
        casinoCategoryTranslation.setRequestInfo(message);
        casinoHistoryService.setRequestInfo(message);
        casinoGameOrderService.setRequestInfo(message);
        casinoStatisticsService.setRequestInfo(message);
        regFreeSpinBonusService.setRequestInfo(message);
        casinoProviderService.setRequestInfo(message);

        switch (message.code) {
            // rtm
            case CommunicationCodes.RTM_GET_CASINO:
                return toBoolean(message.body.toReport) ? rtmService.casinoRtmToExport(message.body) : rtmService.casinoRtmList(message.body);
            case CommunicationCodes.EVOPLAY_CALLBACK:
                return evoplayService.callback(message.body);
            case CommunicationCodes.SLOT_GENERATOR_CALLBACK:
                return slotegratorService.callback(message.body);
            case CommunicationCodes.GAMSHY_CALLBACK:
                return gamshyService.callback(message.body);
            case CommunicationCodes.MASCOT_CALLBACK:
                return mascotService.callback(message.body);
            case CommunicationCodes.PRAGMATIC_CALLBACK:
                return pragmaticService.callback(message.body);
            case CommunicationCodes.B2B_SLOTS_CALLBACK:
                return b2bSlotsService.callback(message.body);
            // CasinoService CRUD
            case CommunicationCodes.CASINO_LIST:
                return casinoService.list();
            // Website Casino Service
            case CommunicationCodes.WEBSITE_CASINO_LIST:
                return websiteCasinoService.list(message.body);
            case CommunicationCodes.WEBSITE_CASINO_CREATE:
                return websiteCasinoService.create(message.body);
            case CommunicationCodes.WEBSITE_CASINO_UPDATE:
                return websiteCasinoService.update(message.body);
            case CommunicationCodes.WEBSITE_CASINO_DELETE:
                return websiteCasinoService.delete(message.body);
            // Casino Game Service
            case CommunicationCodes.CASINO_GAME_LIST:
                return casinoGameService.list(message.body);
            case CommunicationCodes.CASINO_GAME_CREATE:
                return casinoGameService.create(message.body);
            case CommunicationCodes.CASINO_GAME_UPDATE:
                return casinoGameService.update(message.body);
            case CommunicationCodes.CASINO_GAME_UPDATES:
                return casinoGameService.updates(message.body);
            case CommunicationCodes.CASINO_GAME_DELETE:
                return casinoGameService.delete(message.body);
            case CommunicationCodes.CASINO_GAME_REFRESH:
                return casinoGameService.refresh(message.body.id);
            // Casino get last winners
            case CommunicationCodes.GET_CASINO_MAX_WINNERS:
                return casinoStatisticsService.getWinnersList();
            // Casino Games translation
            case CommunicationCodes.GET_CASINO_GAME_NAMES:
                return casinoGamesTranslationService.getList(message.body);
            case CommunicationCodes.SET_CASINO_GAME_NAMES:
                return casinoGamesTranslationService.setList(message.body.id, message.body.data);
            // Casino Session Service
            case CommunicationCodes.CASINO_START:
                return casinoService.startGame(message.body, message.ip);
            case CommunicationCodes.GET_CASINO_GAME_STAKE_LIMITS:
                return casinoService.getCasinoGameLimits(message.body);
            // Casino Category Service
            case CommunicationCodes.CASINO_CATEGORY_LIST:
                return casinoCategoryService.list(message.body);
            case CommunicationCodes.CASINO_CATEGORY_DELETE:
                return casinoCategoryService.remove(message.body);
            case CommunicationCodes.CASINO_CATEGORY_UPDATE:
                return casinoCategoryService.update(message.body);
            case CommunicationCodes.CASINO_CATEGORY_CREATE:
                return casinoCategoryService.create(message.body);
            case CommunicationCodes.GET_CASINO_CATEGORY:
                return casinoCategoryService.findById(message.body);
            // Casino Category Translation
            case CommunicationCodes.GET_CASINO_CATEGORY_TRANSLATE:
                return casinoCategoryTranslation.getList(message.body);
            case CommunicationCodes.SET_CASINO_CATEGORY_TRANSLATE:
                return casinoCategoryTranslation.setList(message.body.id, message.body.data);
            // Casino History
            case CommunicationCodes.GET_CASINO_HISTORY:
                return casinoHistoryService.list(message.body);
            // casino grid
            case CommunicationCodes.GET_CASINO_GAME_ORDER:
                return casinoGameOrderService.list(message.body);
            case CommunicationCodes.UPDATE_CASINO_GAME_ORDER:
                return casinoGameOrderService.update(message.body);
            // freespins
            case CommunicationCodes.FREESPIN:
                return casinoExtraFreeSpinService.updateFreespin(message.body);
            case CommunicationCodes.FREESPINS:
                    return casinoExtraFreeSpinService.updateFreespins(message.body.data, message.body.filter);
            case CommunicationCodes.GET_FREESPINS:
                return casinoExtraFreeSpinService.getFreespin({ ...message.body, include_count: true });
            // registration free spin
            case CommunicationCodes.ADD_REGISTRATION_FREE_SPIN:
                return regFreeSpinBonusService.create(message.body);
            case CommunicationCodes.UPDATE_REGISTRATION_FREE_SPIN:
                return regFreeSpinBonusService.update(message.body);
            case CommunicationCodes.LIST_REGISTRATION_FREE_SPIN:
                return regFreeSpinBonusService.list(message.body);
            case CommunicationCodes.APPLY_REGISTRATION_FREE_SPIN:
                return RegFreeSpinBonusService.ApplyRegistrationFreeSpinBonuses(message.body);

            case CommunicationCodes.UPDATE_CASINO_PROVIDER:
                return casinoProviderService.update(message.body);
            case CommunicationCodes.LIST_CASINO_PROVIDER:
                return casinoProviderService.find(message.body);
            case CommunicationCodes.SLOTEGRATOR_SELF_VALIDATE:
                return Slotegrator.SelfValidate();
            case CommunicationCodes.GET_USER_CASINO_FINANCIAL:
                return userFinancialService.FinancialReport(message.body);
            case CommunicationCodes.GET_BETS_BY_DATE_STATS:
                return casinoHistoryService.betsByDate(message.body);
            case CommunicationCodes.GET_CASINO_BONUS_BALANCE:
                return bonusWalletService.getUserBalance(message.body.user_id);
            case CommunicationCodes.GET_CASINO_BONUS_WALLETS:
                return bonusWalletService.getWallets(message.body);
            case CommunicationCodes.GET_CASINO_BONUS_SPINS:
                return casinoExtraFreeSpinService.getFreespin({ ...message.body, include_won_amount: true, include_count: true });
            case CommunicationCodes.APPLY_FIRST_DEPOSIT_BONUS:
                return bonusWalletService.add(message.body);
            case CommunicationCodes.RESEND_GGR:
                return CasinoService.SendGGR(message.body.from, message.body.to);

            // Cash Backs
            case CommunicationCodes.GET_CASH_BACKS:
                return new CashBackFilter(message.body).FilterAllCashBacks();
            case CommunicationCodes.SET_CASH_BACK:
                return CashBackService.Create(message.body);
            case CommunicationCodes.GET_SUB_CASH_BACKS:
                return CashBackFilter.FindSubCashBacks(message.body);
            case CommunicationCodes.GET_CASH_BACKABLE_USER:
                return new CashBackableUsersFilter(message.body).Filter();
            case CommunicationCodes.SET_CASH_BACKABLE_USER:
                return CashBackableUser.Update(message.body);
            case CommunicationCodes.EDIT_CASH_BACK:
                return CashBackService.Update(message.body);
            case CommunicationCodes.DELETE_CASH_BACK: 
                return CashBackService.Delete(message.body);    
        }
    }
}
