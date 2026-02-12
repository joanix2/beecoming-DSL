using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using opteeam_api.Controllers;
using opteeam_api.EmailTemplates;
using opteeam_api.Models;
using opteeam_api.DTOs;
using opteeam_api.Services;
using opteeam_api.Utils;

namespace opteeam_api.Extensions
{
    public static class UserManagerExtensions
    {
        /// <summary>
        /// Envoie un e-mail de confirmation
        /// </summary>
        public static async Task SendEmailConfirmationLinkAsync(this UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            ApplicationUser user,
            HttpRequest request,
            IUrlHelper urlHelper, string? password = null)
        {
            // Genere un jeton de confirmation d'e-mail pour l'utilisateur
            var emailConfirmationToken = await userManager.GenerateEmailConfirmationTokenAsync(user);

            // Cree un lien de confirmation en utilisant le jeton genere
            var confirmationLink = urlHelper.Action(
                nameof(AuthController.ConfirmEmail),
                "Auth",
                new { userId = user.Id, token = emailConfirmationToken },
                request.Scheme);

            // Genere le corps de l'e-mail en utilisant un modele d'e-mail
            string body = await EmailGenerator.GetConfirmEmailTemplateAsync(
                confirmationLink ?? string.Empty,
                password != null ? $"Votre mot de passe est : {password}" : string.Empty
            );

            // Envoie l'e-mail de confirmation si l'adresse e-mail de l'utilisateur n'est pas vide
            if (!string.IsNullOrEmpty(user.Email))
            {
                await emailService.SendEmailAsync(user.Email, "Confirmez votre adresse e-mail", body);
            }
        }
    }
}

