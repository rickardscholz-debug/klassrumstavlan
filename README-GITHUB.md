# Klassrumstavlan

En svensk digital klassrumstavla, färdig för GitHub Pages.

## Publicera den färdiga webbplatsen

1. Skapa ett offentligt GitHub-repository (kostnadsfri Pages-hosting med GitHub Free), exempelvis `klassrumstavlan`.
2. Lägg projektets filer i repositoryt på grenen `main`. Den färdiga sidan finns i `dist-pages/` och publiceringsflödet i `.github/workflows/pages.yml`.
3. Öppna **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Öppna **Actions → Publish Klassrumstavlan → Run workflow** om publicering inte redan har startat.
5. När publiceringen är grön visas webbplatsens adress under **Settings → Pages**.

Alternativ utan GitHub Actions: ladda upp innehållet i `dist-pages/` till roten av ett repository och välj **Deploy from a branch → main → /(root)** i Pages-inställningarna. Ingen server, API-nyckel eller betald tjänst krävs.

## Använd tavlan

- Pennan vid schemat öppnar redigering av måndag–fredag. Schemat som visas första gången är ett redigerbart exempel.
- **Importera schema** läser JPG, PNG, WebP, textbaserad PDF, TXT, CSV eller TSV. Fototolkning sker i webbläsaren med Tesseract. Första användningen hämtar språkdata via internet; skolans nätverk måste tillåta detta.
- Kontrollera den tolkade texten. Behåll en veckodag åt gången, en lektion per rad: `08:15–09:00 Svenska`. Förhandsgranska och lägg sedan till. Befintliga lektioner behålls.
- Skannade PDF-filer utan text behöver sparas som foto/skärmbild först. Högst tio PDF-sidor läses.
- Pennan vid lektionsplaneringen ändrar rubrik och text.
- Timer: välj 5, 10, 15 eller 25 minuter, eller ange 1–180 minuter. Starta, pausa och återställ. När tiden är slut visas en signal och valfritt ljud spelas.
- UR Play, SVT Play, SLI och Skolon öppnas i en ny flik. Egna länkar kan läggas till. Tjänsternas egna konton/abonnemang kan behövas.
- Musik: välj MP3, WAV, OGG eller M4A, alternativt en direkt ljudlänk. Spotify och YouTube Music öppnas separat. Ljudfiler kan spelas i slinga.
- Bakgrund: strand med långsam zoom, animerade färgbakgrunder, egen bild eller video. Video spelas utan ljud i en slinga.
- Rita med mus eller pekskärm. Välj penna, färg och sudd.
- Knapparna längst ned visar och döljer verktyg. Helskärm passar projektorn.

## Sparande

Schema, text, ritning och valda mediefiler sparas automatiskt i IndexedDB på den aktuella webbläsaren och webbplatsadressen. Inga klassuppgifter skickas till GitHub. En annan dator har sin egen tavla. Rensade webbplatsdata tar bort den lokala tavlan. Exportera regelbundet via **Inställningar → Exportera en säkerhetskopia**. Säkerhetskopian innehåller även valda musik- och bakgrundsfiler. Ladda inte upp säkerhetskopior till ett offentligt repository.

## Ändra koden

Node 22 eller senare och pnpm används. Installera projektets låsta beroenden och kör `pnpm run build:pages` efter en ändring. Publicera även det uppdaterade innehållet i `dist-pages/`. GitHub-flödet publicerar den färdigbyggda mappen och behöver inga hemligheter utöver GitHubs normala workflow-behörigheter.

Strandfoto: Joel_shoots / Unsplash, https://unsplash.com/photos/an-aerial-view-of-a-beach-and-a-wave-O3xvr2chnhU. Originalbilden är ett stillfoto. Rörelsen i strandalternativet är panorering/zoom, inte filmade vågor. Egen MP4/WebM ger riktig videobakgrund.

Officiell dokumentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
