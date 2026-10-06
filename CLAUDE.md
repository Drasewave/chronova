## Contexte projet : graphify d'abord
 
Ne jamais relire tout le projet pour se remettre en contexte. Le knowledge graph généré par graphify (`graphify-out/`) est la source de contexte principale.
 
### Début de session
1. Si `graphify-out/GRAPH_REPORT.md` existe, le lire en premier. Il donne les concepts clés, les nœuds centraux, les communautés et les connexions importantes.
2. S'il n'existe pas, lancer `/graphify .` une fois pour construire le graphe, puis lire le rapport.
3. Relire ensuite `tasks/lessons.md` et `tasks/todo.md`.
### Pendant le travail
- Pour comprendre une partie du code, interroger le graphe avant tout `Glob`, `Grep` ou lecture de fichiers :
  `graphify query "flux d'authentification" --graph graphify-out/graph.json`
- N'ouvrir que les fichiers que le graphe désigne comme pertinents, jamais des dossiers entiers « pour voir ».
- `Grep` et `Glob` restent autorisés pour une recherche précise (nom exact de fonction, chaîne, fichier connu), pas pour explorer.
- Les questions d'architecture se répondent à partir de `GRAPH_REPORT.md` et du graphe, pas en reparcourant le code.
### Garder le graphe à jour
- Après un changement structurel (nouveau module, gros refactoring, fichiers déplacés ou supprimés), relancer `/graphify .`.
- Pour une longue session de développement, `/graphify . --watch` synchronise le graphe au fil des modifications.
- Si le graphe semble contredire le code, le code fait foi : reconstruire le graphe avant de continuer.
## Workflow Orchestration
 
### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
- Build plans from the graphify graph, not from a full re-read of the codebase
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
- ALWAYS pick the subagent model explicitly (see "Choix du modèle des sous-agents")
- Every subagent prompt tells it to use `graphify-out/` (report + `graphify query`) before reading raw files
### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
- If the change was structural, rebuild the graph before closing the task
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Use the graph to trace the affected code paths instead of grepping blindly
- Zero context switching required from the user
- Go fix failing CI tests without being told how
## Choix du modèle des sous-agents
 
Chaque appel à l'outil Agent DOIT préciser le paramètre `model` selon cette règle :
 
| Modèle | Quand l'utiliser |
|---|---|
| `haiku` | Tâches rapides et simples : recherche d'informations, lecture/analyse légère, vérification, petites modifications, exploration du projet, recherche de fichiers, collecte de contexte, tâches répétitives, requêtes graphify. |
| `sonnet` | Tâches moyennes : développement de fonctionnalités, corrections de bugs, analyse technique, modifications de plusieurs fichiers, refactoring modéré, tests et implémentations nécessitant du raisonnement. |
| `opus` | Tâches complexes : architecture, problèmes difficiles, décisions techniques importantes, gros refactoring, debugging complexe, conception globale, tâches nécessitant plusieurs étapes de raisonnement. |
 
Règles d'application :
- En cas de doute entre deux niveaux, prendre le niveau supérieur.
- Découper une grosse tâche : collecte de contexte via le graphe en `haiku`, implémentation en `sonnet`, décisions d'architecture et revue finale en `opus`.
- Lancer en parallèle les sous-agents indépendants (ex. plusieurs requêtes `haiku` sur le graphe).
- Le sous-agent reçoit un prompt autonome et complet (il ne voit pas la conversation) et renvoie une conclusion courte, pas un dump de fichiers.
- Le contexte principal sert à orchestrer et décider ; la lecture de code se fait dans les sous-agents, guidée par le graphe.
## Skills à toujours utiliser
 
Avant de commencer une tâche, charger les skills correspondants avec l'outil Skill. Ne pas improviser une approche quand un skill la couvre.
 
### À chaque tâche de code
- `graphify` : contexte du projet (voir section dédiée)
- `planning-and-task-breakdown` : découper avant d'implémenter (avec `tasks/todo.md`)
- `search-first` : vérifier ce qui existe déjà avant d'écrire du nouveau code (via le graphe)
- `incremental-implementation` : avancer par petites étapes vérifiables
- `verification-loop` : prouver que ça marche avant de déclarer terminé
- `code-review-and-quality` : relire son propre diff avant de rendre la main
### Selon le type de tâche
- **Feature nouvelle** : `spec-driven-development`, `test-driven-development`
- **Bug** : `debugging-and-error-recovery`
- **Refactoring** : `code-simplification`
- **UI / frontend** : `impeccable`, `design-taste-frontend`, `web-design-guidelines`, `make-interfaces-feel-better`, `accessibility`
- **Next.js** : `nextjs-app-router-patterns`
- **Paiement / panier** : `stripe-integration`, `cart-logic`, `security-and-hardening`
- **Configurateur produit / 3D** : `product-configurator-design`, `3d-web-experience`
- **Sécurité, auth, données utilisateur** : `security-and-hardening`
- **Commit / PR** : `git-workflow-and-versioning`
- **Texte rédigé (README, docs, copy)** : `stop-slop`, `documentation-and-adrs`
### Règles sur les skills
- Plusieurs skills peuvent s'appliquer à une même tâche : les charger tous.
- Quand deux skills se recoupent (ex. `design-system` existe en double, `security-review` aussi), utiliser celui listé ici.
- Un sous-agent qui fait une tâche couverte par un skill doit être instruit de charger ce skill.
## Task Management
 
1. **Load Context**: Read `graphify-out/GRAPH_REPORT.md` (build the graph if missing)
2. **Plan First**: Write plan to `tasks/todo.md` with checkable items
3. **Verify Plan**: Check in before starting implementation
4. **Track Progress**: Mark items complete as you go
5. **Explain Changes**: High-level summary at each step
6. **Document Results**: Add review section to `tasks/todo.md`
7. **Capture Lessons**: Update `tasks/lessons.md` after corrections
8. **Refresh Graph**: Rebuild with `/graphify .` after structural changes
## Core Principles
 
- **Graph Before Files**: Get context from the knowledge graph, not by re-reading the project.
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
