export interface IBaseRtmFilter {
    id?: number;
    page?: number;
    limit?: number;
    unlimit?: boolean;
    sort_by?: string;
    sort_order?: string;
    user_id?: number;
    user_country_id?: string[];
    user_group_id?: number[];
    user_status_id?: number[];
    user_name?: string;
    user_registration_ip?: string;
}