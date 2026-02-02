/**
 * Global type definitions for sls CLI
 */
/** Error codes */
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode["INVALID_PATH"] = "INVALID_PATH";
    ErrorCode["INVALID_DEPTH"] = "INVALID_DEPTH";
    ErrorCode["PARSE_ERROR"] = "PARSE_ERROR";
    ErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    ErrorCode["INVALID_FILTER"] = "INVALID_FILTER";
})(ErrorCode || (ErrorCode = {}));
