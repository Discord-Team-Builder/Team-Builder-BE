/**
 * HTTP Status Codes with Descriptions
 */
export const StatusCode = {
    /** 200 - Success */
    OK: 200,
  
    /** 201 - Resource Created */
    CREATED: 201,
  
    /** 202 - Request Accepted but Processing Later */
    ACCEPTED: 202,
  
    /** 204 - Success but No Content */
    NO_CONTENT: 204,
  
    /** 400 - Bad Request (Missing Fields, Invalid Data) */
    BAD_REQUEST: 400,
  
    /** 401 - Unauthorized (Invalid Credentials / Token) */
    UNAUTHORIZED: 401,
  
    /** 402 - Payment Required */
    PAYMENT_REQUIRED: 402,
  
    /** 403 - Forbidden (Access Denied) */
    FORBIDDEN: 403,
  
    /** 404 - Not Found (User / Data Not Found) */
    NOT_FOUND: 404,
  
    /** 405 - Method Not Allowed */
    METHOD_NOT_ALLOWED: 405,
  
    /** 409 - Conflict (Duplicate Resource) */
    CONFLICT: 409,
  
    /** 422 - Unprocessable Entity (Validation Failed) */
    UNPROCESSABLE_ENTITY: 422,
  
    /** 429 - Too Many Requests (Rate Limit) */
    TOO_MANY_REQUESTS: 429,
  
    /** 500 - Internal Server Error */
    INTERNAL_SERVER_ERROR: 500,
  
    /** 501 - Not Implemented */
    NOT_IMPLEMENTED: 501,
  
    /** 502 - Bad Gateway */
    BAD_GATEWAY: 502,
  
    /** 503 - Service Unavailable */
    SERVICE_UNAVAILABLE: 503,
  
    /** 504 - Gateway Timeout */
    GATEWAY_TIMEOUT: 504,
};
  