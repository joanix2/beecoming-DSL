using System.Security.Cryptography;
using System.Text;

namespace opteeam_api.Utils;

/// <summary>
/// Classe utilitaire pour générer des mots de passe aléatoires
/// </summary>
public static class PasswordGenerator
{
    /// <summary>
    /// Générer un mot de passe aléatoire
    /// </summary>
    /// <param name="length"></param>
    /// <returns></returns>
    /// <exception cref="ArgumentException"></exception>
    public static string GeneratePassword(int length = 10)
    {
        if (length < 3)
            throw new ArgumentException("Le mot de passe doit avoir au moins 3 caractères pour satisfaire les contraintes.");

        const string lowerChars = "abcdefghijklmnopqrstuvwxyz";
        const string upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const string digitChars = "1234567890";
        const string specialChars = "!@#$%^&*()";
        const string allChars = lowerChars + upperChars + digitChars + specialChars;

        StringBuilder password = new StringBuilder();
        Random random = new Random();

        // Garantir qu'on a au moins un de chaque type
        password.Append(upperChars[random.Next(upperChars.Length)]);
        password.Append(digitChars[random.Next(digitChars.Length)]);
        password.Append(specialChars[random.Next(specialChars.Length)]);

        // Remplir le reste du mot de passe
        for (int i = 3; i < length; i++)
        {
            password.Append(allChars[random.Next(allChars.Length)]);
        }

        // Mélanger les caractères pour éviter un ordre prévisible
        return Shuffle(password.ToString());
    }

    private static string Shuffle(string input)
    {
        char[] array = input.ToCharArray();
        using (RandomNumberGenerator rng = RandomNumberGenerator.Create())
        {
            int n = array.Length;
            while (n > 1)
            {
                byte[] box = new byte[1];
                do rng.GetBytes(box);
                while (!(box[0] < n * (byte.MaxValue / n)));
                int k = (box[0] % n);
                n--;
                (array[n], array[k]) = (array[k], array[n]);
            }
        }
        return new string(array);
    }
}