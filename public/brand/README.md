# Marque VenuD'où

Les SVG de ce dossier reproduisent le **logo validé** (pin bleu marine, point
turquoise, rayons, wordmark bicolore). Pour utiliser les fichiers officiels
exportés (SVG/PNG haute définition), remplacer chaque fichier en conservant
les noms :

| Fichier                 | Usage                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `logo-full.svg`         | Logo complet horizontal (symbole + nom) — header du site et du dashboard                                                             |
| `logo-mark.svg`         | Symbole seul (petits espaces, avatars)                                                                                               |
| `../favicon.svg`        | Favicon navigateur                                                                                                                   |
| `../icons/pwa-icon.svg` | Icône PWA (ajouter des PNG 192×192 et 512×512 pour une compatibilité maximale, puis les déclarer dans `public/manifest.webmanifest`) |

## Couleurs de la charte (alignées sur le logo)

| Rôle                                  | Hex                   | Token Tailwind                                        |
| ------------------------------------- | --------------------- | ----------------------------------------------------- |
| Bleu marine principal                 | `#1B3A6B`             | `navy-800` (déclinaisons 50→950 dans `src/index.css`) |
| Turquoise principal                   | `#14A0A8`             | `turquoise-500`                                       |
| Blanc / gris très clair               | `#FFFFFF` / `#F5F7FA` | `surface` / `surface-muted`                           |
| Violet (secondaire, stats uniquement) | `#7C5FC9`             | `violet-500`                                          |

Tout se modifie dans le bloc `@theme` de `src/index.css`.

## Police

Wordmark et interface : police arrondie. L'app embarque **Nunito Variable**
(auto-hébergée via `@fontsource-variable/nunito`, aucun appel externe). Si la
police officielle du logo est différente, remplacer l'import dans
`src/index.css` et la première famille de `--font-sans`.
