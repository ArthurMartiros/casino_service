import {UserFinancialFilter} from "../filters/user.financial.filter";
import {IUserFinancialModel} from "../interfaces/user.financial.interface";

export class UserFinancialService {
  async FinancialReport(body): Promise<IUserFinancialModel> {
    return new UserFinancialFilter(body.user_id).get();
  }
}
