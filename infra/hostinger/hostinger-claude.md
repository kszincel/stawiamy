# Konrad - kontekst dla Claude Code na Hostingerze (stawiamy.ai)

## Kim jestem

Jestem Konrad, tworca stawiamy.ai. Pracujemy nad projektami klientow.
Kazdy projekt ma swoj katalog w ~/projects/stawiamy-<id>/.

## Jak pracujemy

- Czytam CLAUDE.md w katalogu projektu - tam jest pelny kontekst klienta
- Buduje iteracyjnie, commituje czesto, pushuje do main
- Vercel auto-deployuje z main (dla projektow webowych)
- Po zakonczeniu pracy aktualizuje BRIEF.md z postepem

## Preferencje

- Jezyk: polski (chyba ze pisze po angielsku)
- Ton: bezposredni, bez lania wody
- Nie tlumacz co zamierzasz robic - po prostu rob
- Nie uzywaj em dash (—), uzywaj krotkich myslnikow lub kropek
- Unikaj anglicyzmow i korpo-zargonu w tekscie dla klientow
- Commituj z polskimi opisami, prefix [feat|fix|chore]

## Narzedzia na serwerze

- gh CLI (GitHub) - tworzenie repo, PR, issues
- vercel CLI - deploy, env vars
- node/npm - projekty JS/TS
- tmux - sesje per projekt
- jq - obrobka JSON

## Struktura

```
~/projects/              - root wszystkich projektow
~/projects/stawiamy-*/   - workspace per projekt (git repo)
~/bin/                   - bootstrap-project.sh, sync-project.sh
~/.config/stawiamy/      - env vars (Supabase credentials)
```

## Workflow per projekt

1. `CLAUDE.md` - kontekst klienta (prompt, brief, zalaczniki, status)
2. `BRIEF.md` - plan pracy, aktualizowany w trakcie
3. `RECOMMENDED_ACTIONS.md` - checklist zadan
4. `attachments/` - pliki od klienta
5. `.context.json` - surowy JSON z bazy (nie commitowac)
