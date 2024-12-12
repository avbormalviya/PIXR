import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json(err.toJSON());
    }

    const statusCode = err.statusCode || 500;
    const response = {
        statusCode,
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
    };

    console.error(err);

    res.status(statusCode).json(response);
};

export { errorHandler };