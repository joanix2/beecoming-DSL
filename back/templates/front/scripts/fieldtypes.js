const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Chemin pour enregistrer le fichier JSON
const outputFilePath = path.join(__dirname, "..", "src", "app", "api", "models", "field-type.ts");

// Fonction pour déterminer le module à utiliser (http ou https)
function getHttpModule(url) {
  return url.startsWith("https") ? https : http;
}

// Fonction pour appeler l'API et écrire dans un fichier
function fetchAndSaveJson(url) {
  const httpModule = getHttpModule(url);

  httpModule
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        console.error(`Erreur : HTTP ${response.statusCode}`);
        response.resume(); // Consomme la réponse pour libérer la mémoire
        return;
      }

      let data = "";

      // Recevoir les données par morceaux
      response.on("data", (chunk) => {
        data += chunk;
      });

      // Une fois toutes les données reçues
      response.on("end", () => {
        try {
          // Parse le JSON
          const jsonData = JSON.parse(data);

          // Écrire les nouvelles données dans le fichier
          fs.appendFileSync(outputFilePath, "\nexport const FieldTypeDefinition = ", "utf8");
          fs.appendFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), "utf8");
          console.log(`Fichier JSON créé avec succès : ${outputFilePath}`);
        } catch (err) {
          console.error("Erreur lors du parsing JSON :", err.message);
        }
      });
    })
    .on("error", (err) => {
      console.error("Erreur lors de la requête :", err.message);
    });
}

// Vérifier les arguments de la ligne de commande
const url = process.argv[2]; // Récupère le premier argument (URL)

if (!url) {
  console.error("Erreur : Veuillez fournir une URL comme argument.");
  process.exit(1);
}

// Appeler la fonction avec l'URL fournie
fetchAndSaveJson(url);
