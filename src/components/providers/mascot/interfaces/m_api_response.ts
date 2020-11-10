export interface IMApiResponse<T> {
    result: T;
    error: IMError;
}

export interface IMError {
    code: number;
    message: string;
}