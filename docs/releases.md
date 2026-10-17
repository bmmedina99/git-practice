# Releases de KiraKana con GitHub Actions

Esta implementación se prueba en `git-practice` y se puede copiar a KiraKana.
Usa Git, Node 24, pnpm y GitHub CLI. Node ejecuta directamente TypeScript;
`tsc --noEmit` comprueba los tipos y Vitest ejecuta las pruebas. Las dependencias
de desarrollo se instalan con `pnpm install --frozen-lockfile`. No publica en npm.

Bash en los workflows valida los títulos de PR, aplica los archivos preparados,
crea el commit y el tag, los sube atómicamente y publica el GitHub Release.
TypeScript calcula SemVer, relaciona los PR originales, prepara el changelog y
los manifiestos y detecta releases pendientes de recuperar.

## Flujo acordado

```text
feature/* ── PR + squash ──> develop ── PR + merge commit ──> production
                              ↑                               │
                       push de bmmedina99                      └─ release automático
```

- Los PR hacia `develop` deben tener título Conventional Commits. Al hacer
  squash, conservar ese título y los pies `BREAKING CHANGE:` del mensaje.
- El PR de `develop` a `production` se integra con **Create a merge commit**.
  No hacer squash ni rebase en esta promoción: necesitamos conservar los SHA
  originales para vincularlos con los PR de `develop`.
- Los commits directos a `develop` también se analizan, pero sus entradas no
  muestran PR ni agradecimiento, tal como se ha acordado.
- Publicar no necesita un PR adicional: el workflow sube directamente a
  `production` la versión y el changelog.

## Archivos

| Archivo | Función |
| --- | --- |
| `.github/workflows/release.yml` | Publicar al hacer push a `production`; simulación y reintento manual |
| `.github/workflows/pull-request-checks.yml` | Validar títulos en Bash y ejecutar los checks de calidad del proyecto |
| `.github/workflows/release-checks.yml` | Comprobar tipos y probar la herramienta con Vitest en PR y pushes a `develop` |
| `.github/CODEOWNERS` | Solicitar revisión a `@bmmedina99` |
| `scripts/release/core.ts` | Conventional Commits y SemVer |
| `scripts/release/github.ts` | API REST de lectura con paginación y control de errores |
| `scripts/release/notes.ts` | Entradas, agradecimientos a los PR y conservación del historial |
| `scripts/release/release.ts` | Planificar la versión, preparar archivos y detectar publicaciones pendientes |

## Versiones y changelog

La fuente de verdad es el **mayor tag estable `vX.Y.Z` alcanzable desde
`production`**, comparando números, no cadenas. Se ignoran prereleases, tags
con otros formatos y tags de ramas no integradas. `package.json` se actualiza
desde ese tag aunque su versión anterior sea diferente.

| Cambio desde el tag anterior | Incremento | Sección |
| --- | --- | --- |
| `fix:` o `fix(scope):` | patch | Fixes |
| `feat:` o `feat(scope):` | minor | Features |
| `perf:` o `perf(scope):` | minor | Performance |
| `tipo!:` / `tipo(scope)!:` / pie `BREAKING CHANGE:` o `BREAKING-CHANGE:` | major | Breaking Changes |
| Otros tipos, sin breaking change | ninguno | No se incluyen |

Se lee el mensaje completo, no solo el asunto. Gana el incremento más alto;
un breaking change aparece únicamente en Breaking Changes. Se omiten las
secciones vacías. Un breaking change también incrementa major desde `0.x`.
Sin tags se usa la base `0.0.0`: primer fix → `0.0.1`, feat/perf → `0.1.0`, breaking
change → `1.0.0`. No se crea release si no hay cambios publicables.

Ejemplo ilustrativo:

```markdown
## v0.1.0 - 2026-10-04

### Features

- kana: añadir práctica (#42) (a1b2c3d) - thanks @colaborador

### Performance

- cache: reutilizar resultados (f1a2b3c)

### Fixes

- corregir teclado (d4e5f6a)
```

La primera entrada procede de un squash PR hacia `develop`. Las otras dos son
commits directos. El autor del agradecimiento es el autor del PR original; nunca
se sustituye por el autor del PR de promoción. El hash es el del commit que
llegó a producción. La implementación asume squash en los PR de funcionalidades
a `develop`; un PR integrado con merge/rebase requiere adaptar esta asociación.

La nueva sección se añade al principio de `CHANGELOG.md`, conservando versiones
anteriores. El cuerpo del release es exactamente esa sección nueva, incluido
el enlace de comparación; no se publica todo el historial acumulado.

El commit generado tiene exactamente este formato:

```text
chore(release): :bookmark: v0.1.0 [skip ci]
```

El tag apunta al commit que contiene tanto `package.json` como `CHANGELOG.md`.
Si existen `package-lock.json` o `npm-shrinkwrap.json`, sus versiones raíz
también se sincronizan. El lockfile de pnpm no guarda esa versión raíz.

## Créditos de los PR

No se calcula ni se genera la sección **New Contributors**. Se conserva el
agradecimiento `thanks @usuario` al autor del PR original de `develop`; los
commits directos solo muestran su hash. Ya no se consulta el historial de
autores mediante la API de commits de GitHub. Los PR se siguen paginando para
mantener la asociación con sus squash commits.

Las secciones históricas de `CHANGELOG.md` se conservan, aunque contengan
New Contributors de versiones anteriores. Al recuperar una publicación antigua
se utiliza su sección original, tal como quedó guardada en el tag.

## Activar PR obligatorios y revisión en develop

Estas reglas se configuran en GitHub; subir los YAML no las activa. Para el
repositorio público de la cuenta personal `bmmedina99`, en **Settings → Branches →
Add classic branch protection rule**, crear una regla para `develop`:

1. Activar **Require a pull request before merging**.
2. Activar **Require approvals**, con una aprobación, y **Require review from
   Code Owners**. Opcionalmente invalidar aprobaciones al recibir cambios nuevos.
3. Activar **Require status checks to pass before merging** y seleccionar
   **Release tooling** y **Conventional PR title** después de su primera ejecución.
   La validación del título ahora tiene su propio check en `pull-request-checks.yml`.
4. Mantener desactivado **Do not allow bypassing the above settings** para que
   el propietario administrador pueda hacer push directo. No conceder bypass
   adicional. Mantener desactivados force pushes y borrado de rama.

La excepción de la protección clásica es para administradores, no una lista
arbitraria de usuarios en un repositorio personal. Con el propietario como
único administrador, permite el push directo de `bmmedina99`; el resto de
colaboradores necesita PR. Si más adelante necesitas excepciones para otros
usuarios concretos, habrá que revisar el modelo de permisos, por ejemplo usando
una organización. Otros rulesets activos pueden imponer restricciones adicionales.

No activar **Require linear history** en `production`: impediría los merge
commits de promoción. Tampoco se recomienda en `develop` si vas a sincronizar
la rama desde `production` mediante el merge descrito más abajo.

`CODEOWNERS` debe existir en la **rama base** de cada PR. Hay que integrar el
archivo tanto en `develop` como en `production`. GitHub solicitará revisión de
PR no borradores y al marcar un borrador como listo. La solicitud es nativa:
no hace falta un workflow con permisos de escritura para asignar reviewers.

**No puedes revisar o aprobar tu propio PR.** Los PR abiertos por `bmmedina99`
necesitarán otro reviewer si quieres una aprobación, o el bypass de propietario
para integrarlos. GitHub no puede asignarte como reviewer de tu propio PR.

En **Settings → General → Pull Requests**, permitir squash y merge commits.
Para el mensaje predeterminado del squash, elegir título y descripción del PR;
comprobar el mensaje final para conservar los pies de breaking changes.

Referencias: [protección de ramas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
y [CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).

## Permisos para publicar en production

El job solicita `contents: write` y `pull-requests: read`. Si las reglas permiten
escritura del bot en `production`, basta el `GITHUB_TOKEN` automático y no hace
falta crear un secret.

**`contents: write` no evita una protección que exige PR.** Si proteges
`production` con la misma regla clásica, para conservar el commit directo
acordado puedes utilizar un token fine-grained del propietario:

1. Dar acceso únicamente al repositorio de destino, con **Contents: Read and
   write** y **Pull requests: Read**.
2. Guardarlo como secret de Actions **RELEASE_TOKEN**.
3. Mantener permitido el bypass del administrador en la regla de `production`.
   La identidad que autoriza el push es la del token; el autor Git del commit
   seguirá siendo `github-actions[bot]`.

El workflow usa ese secret si existe, y en su ausencia usa `GITHUB_TOKEN`.
El token del propietario solo resulta necesario al proteger `production` de
esa manera; no se incluye ningún token en el código. Si hay rulesets adicionales
sin bypass, resolverlos antes de activar la publicación.

La subida de rama y tag es atómica, sin force-push. Una actualización concurrente
de `production` o una regla que rechace el tag hace fallar la publicación.
`concurrency` evita solapar releases y no cancela uno ya iniciado.

GitHub no encadena normalmente otros workflows a los eventos creados por
`GITHUB_TOKEN`. Por eso este workflow crea el release en la misma ejecución,
sin esperar a que un segundo workflow se dispare por el tag. Si KiraKana tiene
un despliegue disparado por `release` o `push` de tags, habrá que invocarlo
explícitamente como job/workflow reutilizable o elegir una credencial adecuada.
Además, el mensaje `[skip ci]` solicitado omite workflows de push/pull_request;
no se debe depender de esos eventos para procesar el commit de versión.
[Referencia sobre disparadores](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

## Probar y poner en marcha

Instalar dependencias y ejecutar las comprobaciones locales:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck:release
pnpm run test:release
```

Las pruebas de integración crean repositorios y remotos **locales temporales**,
simulan la API y GitHub CLI y ejecutan los bloques Bash reales del YAML para
verificar publicación, reintento, simulación y rechazo de un push atómico.
No acceden a GitHub ni publican releases reales.

Calcular un plan local de solo lectura:

```bash
GITHUB_REPOSITORY=bmmedina99/git-practice node scripts/release/release.ts
```

Para esta simulación debe estar disponible `GH_TOKEN` o `GITHUB_TOKEN` con lectura
de Contents y Pull requests. No se escriben archivos, commits, tags ni releases.
La salida contiene la versión propuesta y sus notas. El script siempre calcula
un plan; la publicación solo se hace desde los pasos Bash del workflow.

El workflow llama al script con `--output-dir` apuntando a un directorio nuevo
en `$RUNNER_TEMP`, fuera del checkout. Allí prepara `plan.json`, las notas y los
manifiestos actualizados. En `dry_run` estos archivos temporales permiten
inspeccionar el resultado, pero no se copian al repositorio ni se publican.
Los pasos de recuperación, commit/push y publicación se omiten en una simulación.

Para activar, integrar los archivos en `develop`, configurar las reglas y
promover a `production`. **Ese primer push a `production` ya puede publicar**
si hay commits pendientes desde el tag anterior. Para probar primero, ejecutar
la simulación local sobre `develop` después de subirlo; se conservará la
asociación con los PR ya integrados. La base se obtiene de los tags estables
alcanzables, sin fijar una versión en la configuración.

Una vez el workflow está en la rama predeterminada, se puede usar **Actions →
Release → Run workflow**, elegir `production` y dejar `dry_run` activado para
simular. Desactivarlo publica o recupera una publicación pendiente.

Si se subió el tag pero falló la creación del release, volver a ejecutar el
workflow con publicación habilitada. Detecta el commit con el formato exacto
acordado, recupera sus notas del changelog en el tag y crea el release faltante.
No repite el incremento por esos commits. Si además llegaron cambios nuevos,
después de recuperar la publicación anterior puede publicar la siguiente.

Tras cada release, sincronizar los archivos generados hacia `develop` conservando
la historia. Como propietario con push directo permitido, desde un árbol limpio:

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git merge --no-ff origin/production -m "chore: sync release metadata from production"
git push origin develop
```

Este merge de sincronización no dispara un release. Su mensaje no lleva
`[skip ci]`, por lo que pueden ejecutarse los checks de `develop`. Evitar cambiar
manualmente la versión o editar el historial generado para reducir conflictos.

Al trasladar esto a KiraKana, retirar las dependencias/configuración de
semantic-release y regenerar su lockfile con el gestor del proyecto. En este
repositorio de pruebas no hay dependencias semantic-release que eliminar.
Los checks añadidos validan la herramienta de release; incorpora los tests y
el build propios de KiraKana como requisito previo a publicar cuando la migres.
