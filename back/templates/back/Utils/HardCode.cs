using opteeam_api.Models;

namespace opteeam_api.Utils;

/// <summary>
///     Custom enum class
/// </summary>
public abstract class CustomEnum<T>
{
    // Ids pour les statuts d'absence

    public abstract T[] GetEnum();
}

/// <summary>
///     Role enum
/// </summary>
public class RoleEnum : CustomEnum<string>
{
    public (string Id, string Role, string Color) OPERATOR = (
        HardCode.OPERATOR_ID,
        HardCode.OPERATOR_LABEL,
        "#2A61A1"
    );

    public (string Id, string Role, string Color) SUPERVISOR = (
        HardCode.SUPERVISOR_ID,
        HardCode.SUPERVISOR_LABEL,
        "#FF9A1B"
    );

    public (string Id, string Role, string Color) TEAMLEADER = (
        HardCode.TEAMLEADER_ID,
        HardCode.TEAMLEADER_LABEL,
        "#A83C88"
    );

    public override string[] GetEnum()
    {
        return [SUPERVISOR.Role, TEAMLEADER.Role, OPERATOR.Role];
    }

    public (string Id, string Role, string Color)[] GetRoleAndColor()
    {
        return [SUPERVISOR, TEAMLEADER, OPERATOR];
    }
}

public static class HardCode
{
    public const string DateFormat = "dd/MM/yyyy";
    public static string SUPERVISOR_LABEL = "supervisor";
    public static string TEAMLEADER_LABEL = "teamleader";
    public static string OPERATOR_LABEL = "operator";
    public static string[] ROLE_IDS = [SUPERVISOR_ID, TEAMLEADER_ID, OPERATOR_ID];
    public static string[] ROLE_LABELS = [SUPERVISOR_LABEL, TEAMLEADER_LABEL, OPERATOR_LABEL];

    //Client,  Orders, OrdersType et OrdersStatus HTTP Fail
    public static string CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND";
    public static string ORDER_NOT_FOUND = "ORDER_NOT_FOUND";
    public static string ORDER_TYPE_NOT_FOUND = "ORDER_TYPE_NOT_FOUND";
    public static string ORDER_STATUS_NOT_FOUND = "ORDER_STATUS_NOT_FOUND";
    public static string MISSION_NOT_FOUND = "MISSION_NOT_FOUND";
    public static string MISSION_CANNOT_UPDATE_TO_PASSED_DATE = "MISSION_CANNOT_UPDATE_TO_PASSED_DATE";
    public static string MISSION_CANNOT_UAFFECT_PASSED_DAYS = "MISSION_CANNOT_UAFFECT_PASSED_DAYS";
    public static string MISSION_ASSIGNED_SUCCESSFULLY = "MISSION_ASSIGNED_SUCCESSFULLY";
    public static string MISSION_UNASSIGNED_SUCCESSFULLY = "MISSION_UNASSIGNED_SUCCESSFULLY";
    public static string MISSION_DOCUMENT_NOT_FOUND = "MISSION_DOCUMENT_NOT_FOUND";
    public static string MISSION_ERROR_GET_LIST = "ERROR_GET_MISSIONS_LIST";
    public static string USER_TEAMLEADER__NOT_FOUND = "USER_TEAMLEADER__NOT_FOUND";
    public static string USER_OPERATOR__NOT_FOUND = "USER_OPERATOR__NOT_FOUND";
    public static string USER_OPERATOR_IS_TEAMLEADER = "USER_OPERATOR_IS_TEAMLEADER";
    public static string AFFECTATION_OPERATOR_TEAMLEADER_SUCCESS = "AFFECTATION_OPERATOR_TEAMLEADER_SUCCESS";
    public static string AFFECTATION_OPERATOR_TEAMLEADER_FAIL = "AFFECTATION_OPERATOR_TEAMLEADER_FAIL";
    public static string AFFECTATION_TEAMLEADER_ALREADY_AFFECTED = "AFFECTATION_TEAMLEADER_ALREADY_AFFECTED";

    // AbsenceType HTTP Fail
    public static string ABSENCE_TYPE_NOT_FOUND = "ABSENCE_TYPE_NOT_FOUND";
    public static string ABSENCE_NOT_FOUND = "ABSENCE_NOT_FOUND";
    public static string ABSENCE_ERROR_CREATE = "ABSENCE_ERROR_CREATE";
    public static string ABSENCE_ERROR_UPDATE = "ABSENCE_ERROR_UPDATE";
    public static string ABSENCE_ERROR_DELETE = "ABSENCE_ERROR_DELETE";

    // Http Auth CODES
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

    // http general error codes, codes
    public static string GENERAL_ERROR = "GENERAL_ERROR";
    public static string GENERAL_BAD_FORMAT = "BAD_FORMAT";
    public static string MINIO_FAIL_UPLOAD = "MINIO_FAIL_UPLOAD";
    public static string MINIO_FILE_NOT_FOUND = "MINIO_FILE_NOT_FOUND";
    public static string MINIO_FILE_ALREADY_EXISTS = "MINIO_FILE_ALREADY_EXISTS";
    public static string MINIO_REMOVE_DOCUMENT = "MINIO_REMOVE_DOCUMENT";
    public static string TOO_BIG_FILE = "TOO_BIG_FILE";

    // Affectation operateor teamleaders
    public static string AFFECTATION_CREATED_SUCCESSFULY => "AFFECTATION_CREATED_SUCCESSFULY";
    public static string AFFECTATION_UPDATED_SUCCESSFULY => "AFFECTATION_UPDATED_SUCCESSFULY";

    // format acceptés des images téléversées
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

    // Types MIME pour les archives
    "application/zip",        // .zip
    "application/x-rar-compressed" // .rar
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

    // Ids pour les types de custom forms
    public static readonly Guid CUSTOM_FORM_INFOS_SECTION_ID = Guid.Parse("dd95d28d-617e-414b-95e1-de99372d07bb");
    public static readonly Guid CUSTOM_FORM_CONTEXT_SECTION_ID = Guid.Parse("c7ec5af5-d592-4785-be56-38d2327da6fc");

    public static readonly Guid CUSTOM_FORM_FILES_SECTION_ID = Guid.Parse("68cff7f6-77cd-4429-811e-e45b5b4109ce");

    // Ids pour les rôles
    public static string SUPERVISOR_ID => "747f43e0-ff2a-4488-a5bd-578f013bd091";
    public static string TEAMLEADER_ID => "a0f2b5d4-1c3e-4f8b-9a7c-6d3e2f8b5c1d";


    public static string OPERATOR_ID => "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e";

    // Ids pour les types de missions
    public static string INSPECTION_ID => "b4a90c9f-c956-4aa7-a1ff-dbbc93e8fe33";
    public static string REPARATION_ID => "a4e962f6-2cf0-44ae-a4b4-72aee2856af3";
    public static string PAINT_ID => "02dcd698-e559-4e27-9771-bc327c211e88";

    // Ids pour les types de photos de mission

    public static string PHOTO_HD => "6db5df1a-4f15-40db-862a-f5f036e6ca55";
    public static string PHOTO_LQ => "2b509b5b-aca5-4e36-a456-539688fc7485";

    // Ids pour les types de documents de mission

    public static string DOCUMENTS_ADMINISTRATIFS => "2fb13ab1-f465-4eaf-896d-f78b41a1312b";
    public static string FACTURE => "5c177095-5182-4d40-9061-3104f814065c";
    public static string DIVERS => "7f538a8b-37c0-46a9-9f14-b7c92ffb13b7";

    // Ids pour les types de AbscenceType
    public static string CONGES_ID => "9c93b75f-a6ce-4ab5-93fe-a448fadd3171";
    public static string MALADIE_ID => "3a5c1e3f-62e2-4cff-820b-c9afedec177a";
    public static string FORMATION_ID => "ee3c1c16-b3be-4238-aa79-e7402d34a1ce";

    // Ids pour les types de commandes status
    public static string EN_ATTENTE_ID => "df6981e9-496d-4524-9218-221c17ccb8a0";
    public static string VALIDEE_ID => "0ed6e35a-be5e-4410-b422-3f1e6198c4c2";
    public static string REJETEE_ID => "4e1515dc-b582-4b08-bd7e-28f0cb51f926";


    // Ids pour les types de UserDocumentType
    public static string CARTE_IDENTITE_ID => "d4e3f2a1-b5c6-7d8e-9f0a-1b2c3d4e5f60";
    public static string PERMIS_CONDUIRE_ID => "a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d";
    public static string CERTIFICAT_MEDICAL_ID => "f1e2d3c4-b5a6-7980-1c2d-3e4f5a6b7c8d";
}

public class MissionStatusIdEnum : CustomEnum<MissionStatus>
{
    public const string MISSION_TO_BE_PLANIFIED_ID = "d68bf154-36bd-4497-a56f-7cb786b7115f";
    public const string MISSION_PLANIFIED_ID = "4309eb11-5b11-40c4-90fc-184a7e12d8be";
    public const string MISSION_STARTED_ID = "205e14c3-0cfd-41f0-8968-5d23105816e0";
    public const string MISSION_ONGOING_ID = "54e0a0ff-0126-45dc-8d12-182dec22f0aa";
    public const string MISSION_FINISHED_ID = "4b33092a-d954-4761-b8b5-6078a638c50f";
    public const string MISSION_PAIED_ID = "52335c85-664b-4a5d-a51c-0aa6e1a6b3e5";

    public static MissionStatus MISSION_TO_BE_PLANIFIED = new()
    {
        Id = Guid.Parse(MISSION_TO_BE_PLANIFIED_ID),
        Name = "À planifier",
        Color = "#FF9A1B",
        Icon = null,
        Position = 0
    };

    public static MissionStatus MISSION_PLANIFIED = new()
    {
        Id = Guid.Parse(MISSION_PLANIFIED_ID),
        Name = "Planifiée",
        Color = "#73C6E9",
        Icon = null,
        Position = 1
    };

    public static MissionStatus MISSION_STARTED = new()
    {
        Id = Guid.Parse(MISSION_STARTED_ID),
        Name = "Lancée",
        Color = "#AE73E9",
        Icon = null,
        Position = 2
    };

    public static MissionStatus MISSION_ONGOING = new()
    {
        Id = Guid.Parse(MISSION_ONGOING_ID),
        Name = "En cours",
        Color = "#2A61A1",
        Icon = null,
        Position = 3
    };

    public static MissionStatus MISSION_FINISHED = new()
    {
        Id = Guid.Parse(MISSION_FINISHED_ID),
        Name = "Terminée",
        Color = "#3CA876",
        Icon = null,
        Position = 4
    };

    public static MissionStatus MISSION_PAIED = new()
    {
        Id = Guid.Parse(MISSION_PAIED_ID),
        Name = "Facturée",
        Color = "#BC316A",
        Icon = null,
        Position = 5
    };

    public override MissionStatus[] GetEnum()
    {
        return
        [
            MISSION_TO_BE_PLANIFIED, MISSION_PLANIFIED, MISSION_STARTED, MISSION_ONGOING, MISSION_FINISHED,
            MISSION_PAIED
        ];
    }
}

public class OrderStatusIdEnum : CustomEnum<OrderStatus>
{
    public const string ORDER_REDACTION_ID = "a8d4761f-19b6-428f-9934-51c9bd713fb2";
    public const string ORDER_ONGOING_ID = "b51bb3c4-1fed-45ac-b587-507cf13a854f";
    public const string ORDER_FINISHED_ID = "c81d3fd1-f00c-47e0-9e17-29af102605c5";

    public static OrderStatus ORDER_REDACTION = new()
    {
        Id = Guid.Parse(ORDER_REDACTION_ID),
        Name = "Rédaction",
        Color = "#C9C9C9",
        Icon = null,
        Position = 0
    };

    public static OrderStatus ORDER_ONGOING = new()
    {
        Id = Guid.Parse(ORDER_ONGOING_ID),
        Name = "En cours",
        Color = "#73C6E9",
        Icon = null,
        Position = 1
    };

    public static OrderStatus ORDER_FINISHED = new()
    {
        Id = Guid.Parse(ORDER_FINISHED_ID),
        Name = "Terminée",
        Color = "#3CA876",
        Icon = null,
        Position = 2
    };

    public override OrderStatus[] GetEnum()
    {
        return [ORDER_REDACTION, ORDER_FINISHED, ORDER_ONGOING];
    }
}