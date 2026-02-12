import { Injectable, signal } from "@angular/core";
import { _en } from "./en";
import { _fr, _tr } from "./fr";

export type LANGUAGES = "en" | "fr";

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  /** Permet de chercher une clé à la volée : pratique pour des valeurs non connues au runtime */
  language = signal<_tr>(_fr);
  get(key: string): string {
    return this.language()[key as keyof typeof _fr] || key;
  }

  setLanguage(language: LANGUAGES) {
    switch (language) {
      case "en":
        // this.language.set(_en);
        console.error("Language not supported");
        break;
      case "fr":
        this.language.set(_fr);
        break;
      default:
        this.language.set(_fr);
    }
  }
}
