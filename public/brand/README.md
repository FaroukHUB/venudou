# Emplacements du logo VenuD'où

Les fichiers de ce dossier sont des **placeholders propres**. Ne pas générer de
nouveau logo : remplacer chaque fichier par le logo validé, en conservant les
noms et formats.

| Fichier | Usage | Format attendu |
| --- | --- | --- |
| `logo-full.svg` | Logo complet (symbole + nom), header du site et du dashboard | SVG, fond transparent |
| `logo-mark.svg` | Symbole seul (favicons, avatars, petits espaces) | SVG carré, fond transparent |
| `../favicon.svg` | Favicon navigateur | SVG carré |
| `../icons/pwa-icon.svg` | Icône PWA (manifest) | SVG carré ≥ 512×512 (ajouter des PNG 192/512 si besoin de compatibilité étendue) |

Après remplacement, vérifier `public/manifest.webmanifest` (icônes) et le
composant `src/components/ui/Logo.tsx`.
