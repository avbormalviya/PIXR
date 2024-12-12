class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something Went Wrong",
        errors = [],
        stack = ""
    ) {
        super(message);

        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.data = false;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            success: this.success,
            message: this.message,
            errors: this.errors,
            data: this.data,
        };
    }
}

export { ApiError };