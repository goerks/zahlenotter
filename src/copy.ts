/* Zahlenotter – Kopieren in die Zwischenablage (reine Logik, ohne Oberfläche).
   Die Oberfläche übergibt die Zwischenablage und den Notbehelf, damit sich alles ohne Browser testen lässt. */

export type CopyResult = "ok" | "ersatz" | "fehler";

export interface CopyDeps {
  /** zum Beispiel navigator.clipboard (braucht eine sichere Adresse, https) */
  clipboard?: { writeText(text: string): Promise<void> } | null;
  /** Notbehelf für ältere Browser (document.execCommand("copy")); gibt true zurück, wenn es geklappt hat */
  legacy?: (text: string) => boolean;
}

/**
 * Kopiert `text`. «ok»: die Zwischenablage hat es angenommen. «ersatz»: der Notbehelf hat es geschafft.
 * «fehler»: nichts ging; die Oberfläche zeigt dann ein Feld mit markiertem Text zum Kopieren von Hand.
 * Wirft nie.
 */
export async function copyText(text: string, deps: CopyDeps): Promise<CopyResult> {
  if (deps.clipboard && typeof deps.clipboard.writeText === "function") {
    try {
      await deps.clipboard.writeText(text);
      return "ok";
    } catch {
      /* abgelehnt oder nicht erlaubt: weiter mit dem Notbehelf */
    }
  }
  if (deps.legacy) {
    try {
      if (deps.legacy(text)) return "ersatz";
    } catch {
      /* Notbehelf nicht möglich */
    }
  }
  return "fehler";
}

/** Hinweis nach dem Kopieren, zum Beispiel «Code M2-K7P2Q kopiert» oder «Adresse kopiert» */
export const copiedMessage = (kind: "code" | "addr" | "task", text: string): string =>
  kind === "addr" ? "Adresse kopiert" : `Code ${text} kopiert`;
