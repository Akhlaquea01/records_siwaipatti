export interface ApiResponseShape<T> {
    success: boolean;
    message: string;
    data: T | null;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export class ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    pagination?: ApiResponseShape<T>['pagination'];

    constructor(
        success: boolean,
        message: string,
        data: T | null = null,
        pagination?: ApiResponseShape<T>['pagination']
    ) {
        this.success = success;
        this.message = message;
        this.data = data;
        if (pagination) this.pagination = pagination;
    }

    static ok<T>(data: T, message = 'Success'): ApiResponse<T> {
        return new ApiResponse(true, message, data);
    }

    static list<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        message = 'Success'
    ): ApiResponse<T[]> {
        return new ApiResponse(true, message, data, {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    }

    static error(message: string): ApiResponse<null> {
        return new ApiResponse(false, message, null);
    }
}
