import { authMiddleware } from "./auth";
import { Response } from "express";

describe("authMiddleware", () => {
    let mockRequest: any;
    let mockResponse: any;
    let nextFunction: any = jest.fn();

    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        nextFunction = jest.fn();
    });

    test("should return 401 if no authorization header is present", () => {
        authMiddleware(mockRequest, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.send).toHaveBeenCalledWith("No token");
        expect(nextFunction).not.toHaveBeenCalled();
    });

    test("should call next() and set userId if token is present", () => {
        mockRequest.headers.authorization = "test-token";

        authMiddleware(mockRequest, mockResponse as Response, nextFunction);

        expect(mockRequest.userId).toBe("test-token");
        expect(nextFunction).toHaveBeenCalled();
    });
});