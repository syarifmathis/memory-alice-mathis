# Wörter merken – Übung

Eine einfache Web-App für logopädische Übungen: 10 deutsche Wörter werden
nacheinander kurz gezeigt. Erst wenn alle zehn gezeigt wurden, schreibt
die Person alle Wörter auf, an die sie sich erinnert (freies Erinnern,
Reihenfolge egal). Die aufgeschriebenen Wörter werden automatisch den
gezeigten Wörtern zugeordnet — auch bei kleinen Schreibfehlern — und am
Ende gibt es eine Auswertung mit Punktzahl und Wort-für-Wort-Vergleich.

Die App läuft komplett im Browser (kein Server, keine Datenbank) und
besteht nur aus HTML, CSS und JavaScript.

## Dateien

- `index.html` – Aufbau der Seite (Start-, Übungs- und Ergebnisbildschirm)
- `style.css` – Design
- `script.js` – Ablauflogik (Wortauswahl, Timer, Auswertung)
- `words.js` – **die Wortliste** — hier können Wörter angepasst werden

## Wortliste anpassen

Öffnen Sie `words.js` und bearbeiten Sie die Liste `WORTLISTE`. Jede
Zeile ist ein Wort in Anführungszeichen, durch Komma getrennt:

```js
const WORTLISTE = [
  "Haus",
  "Baum",
  "Auto",
  // ... eigene Wörter hier ergänzen
];
```

Es sollten mindestens 10 Wörter in der Liste sein. Bei jeder Übung
werden automatisch 10 zufällig ausgewählt, sodass sich die Übung von
Sitzung zu Sitzung unterscheidet.

## Auf GitHub veröffentlichen (kostenlos online, ohne eigenen Server)

1. Erstellen Sie auf [github.com](https://github.com) ein neues, leeres
   Repository (z. B. `wort-uebung`) — ohne README, `.gitignore` oder
   Lizenz anzuhaken, da diese Dateien schon vorhanden sind.
2. Laden Sie diesen Ordner hoch. Am einfachsten über die Kommandozeile
   im Ordner mit diesen Dateien:

   ```bash
   git remote add origin https://github.com/<ihr-benutzername>/wort-uebung.git
   git branch -M main
   git push -u origin main
   ```

   (Ein `git init` und der erste Commit sind bereits erledigt.)

3. Auf GitHub: **Settings → Pages** öffnen.
4. Unter **Source** die Option **Deploy from a branch** wählen, als
   Branch **main** und als Ordner **/ (root)** auswählen, dann
   **Save** klicken.
5. Nach ein bis zwei Minuten ist die Seite online erreichbar unter:

   ```
   https://<ihr-benutzername>.github.io/wort-uebung/
   ```

Jede Änderung, die Sie später committen und pushen (z. B. eine neue
Wortliste in `words.js`), wird automatisch auf dieser Adresse
aktualisiert.

## Lokal testen

Die `index.html` kann auch einfach direkt im Browser geöffnet werden
(Doppelklick), ganz ohne Internet oder GitHub — praktisch, um Änderungen
vor dem Hochladen zu prüfen.
