namespace opteeam_api.Utils;

public static class HardCode
{
    // Date format
    public const string DateFormat = "dd/MM/yyyy";

    // Http Auth error codes
    public static string USER_NOT_FOUND = "USER_NOT_FOUND";
    public static string USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";
    public static string WRONG_CREDENTIALS = "WRONG_CREDENTIALS";
    public static string EMAIL_NEEDS_CONFIRMATION = "EMAIL_NEEDS_CONFIRMATION";
    public static string NOT_AUTHORIZED = "NOT_AUTHORIZED";
    public static string TOKEN_IS_INVALID = "TOKEN_IS_INVALID";
    public static string PASSWORD_MISMATCH = "PASSWORD_MISMATCH";
    public static string EMAIL_IS_ALREADY_USED = "EMAIL_IS_ALREADY_USED";
    public static string REGISTER_CONFIRMATION = "REGISTER_CONFIRMATION";
    public static string TOKEN_OR_USER_IS_INVALID = "TOKEN_OR_USER_IS_INVALID";
    public static string FORGOT_PASSWORD_EMAIL_SENT = "FORGOT_PASSWORD_EMAIL_SENT";
    public static string EMAIL_IS_REQUIRED = "EMAIL_IS_REQUIRED";
    public static string PASSWORD_RESET_SUCCESS = "PASSWORD_RESET_SUCCESS";
    public static string EMAIL_CONFIRMATION_SENT = "EMAIL_CONFIRMATION_SENT";

    // Http general error codes
    public static string GENERAL_ERROR = "GENERAL_ERROR";
    public static string GENERAL_BAD_FORMAT = "BAD_FORMAT";
    
    // File upload error codes
    public static string MINIO_FAIL_UPLOAD = "MINIO_FAIL_UPLOAD";
    public static string MINIO_FILE_NOT_FOUND = "MINIO_FILE_NOT_FOUND";
    public static string MINIO_FILE_ALREADY_EXISTS = "MINIO_FILE_ALREADY_EXISTS";
    public static string MINIO_REMOVE_DOCUMENT = "MINIO_REMOVE_DOCUMENT";
    public static string TOO_BIG_FILE = "TOO_BIG_FILE";

    // Allowed file formats
    public static string[] AllowedImagesMimeTypes = new[]
    {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/svg+xml"
    };

    public static string[] AllowedImagesExtensions = new[] { ".png", ".jpg", ".jpeg", ".svg" };

    public static string[] AllowedDocumentsMimeTypes = new[]
    {
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/x-rar-compressed"
    };

    public static string[] AllowedDocumentsExtensions = new[]
    {
        ".pdf",
        ".xls",
        ".xlsx",
        ".csv",
        ".doc",
        ".docx",
        ".zip", 
        ".rar"
    };
}