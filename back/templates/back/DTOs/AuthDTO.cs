using opteeam_api.Models;
using System.ComponentModel.DataAnnotations;

namespace opteeam_api.DTOs
{
    public class LoginInput
    {
        [Required]
        public required string Email { get; set; }
        [Required]
        public required string Password { get; set; }
    }

    public class RegisterInput : BaseUserInput
    {

        [Required]
        [DataType(DataType.Password)]
        public required string Password { get; set; }

        [Required]
        [Compare(nameof(Password))]
        [DataType(DataType.Password)]
        public required string ConfirmPassword { get; set; }
    }

    public class ForgotPasswordInput
    {
        [Required]
        public required string Email { get; set; }
    }

    public class ResetPasswordInput
    {
        [Required]
        public required string Email { get; set; }
        [Required]
        public required string Token { get; set; }
        [Required]
        public required string NewPassword { get; set; }
        [Required]
        public required string NewPasswordConfirmation { get; set; }
    }

    public class TokenOutput
    {
        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
    }

    public class RefreshTokenInput
    {
        [Required]
        public required string RefreshToken { get; set; }
    }
    public class UserInfoOutput
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
    }

    public class RoleOutput
    {
        public required Guid Id { get; set; }
        public required string Name { get; set; }

        public required string Color { get; set; }

        public RoleOutput()
        {

        }

        public RoleOutput(Guid id, string Name, string color)
        {
            Id = id;
            Name = Name ?? "";
            Color = color;
        }

        public RoleOutput(ApplicationRole role)
        {
            Id = role.Id;
            Name = role.Name ?? "";
            Color = role.Color ?? "#fffff";
        }

    }


}
