![FLUJO DE TRABAJO CON GIT: COMANDOS BÁSICOS](./img/banner-git.png)

<h1 style="text-align:center;">FLUJO DE TRABAJO CON GIT: COMANDOS BÁSICOS</h1>

---

<h4>¿Qué es Git y por qué es útil?</h4>

Git es una herramienta de **control de versiones** que nos permite guardar y gestionar cambios en nuestro código. Además de ayudar a recuperar fácilmente versiones anteriores, también facilita el trabajo **colaborativo** con la ayuda de GitHub.

<h4>Objetivo de la guía</h4>

En esta guía, conocerás y aplicarás los **comandos básicos** y esenciales para gestionar **repositorios** con Git & GitHub, siguiendo buenas prácticas y un flujo de trabajo eficiente.

---

Antes de empezar a trabajar con Git, es necesario tenerlo instalado en nuestro sistema. Puedes descargarlo desde la **[página oficial de Git](https://git-scm.com/download/)**. Para probar que lo tienes instalado, prueba a ejecutar el siguiendo comando.

```sh
git --version
```
Deberías poder visualizar la versión de Git más reciente que tienes instalada. Al confirmar la instalación, ahora sí podrás empezar viendo los comandos de Git.

---

<h3>Configuración inicial básica</h3>

Cuando usas Git, es importante que cada commit esté asociado a un autor para saber claramente quien ha hecho los cambios. Esta información incluye tu nombre y dirección de correo.

- **Configurar dirección de correo:**
Asocia tu dirección de correo a los *commits* que hagas en cualquier repositorio. Asegúrate de usar el mismo correo que usas en GitHub para asociarlo correctamente.

```sh
  git config --global user.email "correo@ejemplo.com"
```

- **Configurar nombre del autor:**
Asocia tu nombre a los *commits*, de modo que cada cambio que realices quede registrado con tu nombre.

```sh
  git config --global user.name "{nombre}"
```

> [!NOTE]
> La flag **--global** afecta globalmente a todos los repositorios locales. Si deseas que la configuración solo afecte al repositorio local actual, omítela.

---

<h3>Inicialización de proyectos</h3>

```sh
git init
```
**Inicializa** el repositorio local en la carpeta actual donde te encuentres. Esto generará un directorio `.git` para almacenar el historial del proyecto.

```sh
git remote add <remoto> <repositorio>
```
Agrega un **repositorio remoto** al proyecto local. Este comando es útil después de inicializar un proyecto para **enlazarlo** a un repositorio remoto.

- **Flags útiles del comando:**
  - **`git remote rm <remoto>` →** **Elimina** el repositorio remoto.
  - **`git remote show <remoto>` →** **Información** del repositorio.

> [!NOTE]
> Por lo general, **`<remoto>`** por convención deberá de ser **origin**. Sin embargo, puedes nombrar el remoto como prefieras si se trabaja con múltiples remotos.

```sh
git clone <url-del-repositorio>
```
**Clona** un repositorio remoto, este comando **inicializa** y **enlaza** creando un repositorio local. Por ejemplo, `git clone https://github.com/bmmedina99/git-practice.git`

- **Flags útiles del comando:**
  - **`git clone -b <rama> <URL_del_repositorio>` →** Clona la **rama especificada** del repositorio remoto.
  - **`git clone --single-branch <URL_del_repositorio>` →** Clona solo la rama especificada **sin el seguimiento remoto**.

---

<h3>Primer commit y seguimiento de archivos</h3>

```sh
git status
```
Muestra el estado del repositorio, indicando los archivos **modificados**, **agregados** o **eliminados**, y cuáles están listos para ser **confirmados**.

- **Flags útiles del comando:**
  - **`git status -s` →** Muestra el estado en un formato más **compacto** y **legible**.
    - **`M`**: Modificado
    - **`A`**: Agregado *(staged)*
    - **`D`**: Eliminado
    - **`??`**: No rastreado *(untracked)*
  - **`git status -sb` →** Agrega a la muestra la rama en la que te encuentras.

```sh
git add <archivo>
```
**Agrega** un archivo especifico modificado al área de preparación *(staging area)* para ser incluidos en el siguiente **commit**.

- **Flags útiles del comando:**
  - **`git add -A / git add .` →** Agrega todos los cambios, **incluyendo** archivos nuevos.
  - **`git add -u` →** Agrega todos los cambios, pero **omite** los no rastreados *(untracked)*.

```sh
git commit -m “<mensaje>”
```
**Guarda** los cambios realizados en el área de preparación *(staging area)* en el repositorio local con un mensaje descriptivo de los cambios. Para los mensaje recomiendo usar el estándar de **[Conventional Commits](https://www.conventionalcommits.org/es/)**

- **Flags útiles del comando:**
  - **`git commit -am “{m}”` →** **Agrega** y **guarda** con un mensaje, pero **excluye** los no rastreados.
  - **`git commit --amend` →** Permite **modificar** el mensaje del commit más reciente.

```sh
git log
```
Muestra el **historial de commits** en la rama actual, lo que es útil para **revisar** los cambios anteriores.

- **Flags útiles del comando:**
  - **`git log --graph --oneline --decorate` →** **Recomendado**, muestra el historial en una forma más **compacta** y con referencias entre las ramas.
  - **`git log -n <nº>` →** Muestra únicamente el historial de los últimos **nº commits**.
  - **`git log --author=<nombre>` →** Muestra únicamente los commits del **autor** especificado.

---

<h3>Trabajando con ramas</h3>

```sh
git branch
```
**Muestra** las ramas locales existentes e indica en que rama te **encuentras** actualmente.

- **Flags útiles del comando:**
  - **`git branch <nombre_rama>` →** **Crea** una rama **nueva** con el **nombre** especificado.
  - **`git branch -m <nombre_viejo> <nombre_nuevo>` →** **Renombra** la rama especificada.
  - **`git branch -d <nombre_rama>` →** **Elimina** la rama local especificada ya fusionada.
  - **`git branch -v` →** Muestra las ramas locales con el último **commit** asociado a cada rama.
  - **`git branch -r` →** Muestra **solo** las **ramas remotas**.
  - **`git branch -a` →** Muestra **todas las ramas** locales y remotas.

> [!TIP]
> Flag extra `git branch --set-upstream-to=<remoto>/<rama_remota> <rama_local>`, se usa cuando ya existe una rama remota y solo necesitas configurar tu rama local para que siga a esa rama remota remota.

```sh
git switch <rama>
```
**Cambia** entre diferentes ramas en tu **repositorio local**. Es una **alternativa** a `git checkout`. Es una forma más clara y directa para cambiar entre ramas.

- **Flags útiles del comando:**
  - **`git switch -c <nombre_rama>` →** **Crea** una rama nueva y **cambia** a ella directamente.
  - **`git switch --detach <hash-commit>` →** **Cambia** a un commit especifico en un estado **desconectado** *(detached HEAD)*, es decir, cualquier cambio que se haga no será asociado.
  - **`git switch -` →** Un **atajo** que permite cambiar rápidamente a la **última rama** en la que estabas trabajando.

> [!NOTE]
> El termino **`<hash-commit>`** hace referencia a un identificador único de un commit. Para visualizar este "hash" usa el comando recomendo de `git log`

```sh
git checkout
```
Comando **multiuso**, es el más **poderoso** de Git que se usaba en **muchas tareas** hasta que `git switch` y `git restore` se introdujeron para separar sus funciones.

- **Flags útiles del comando:**
  - **`git checkout <rama>` →** **Cambia** a una rama existente en tu **repositorio local**.
  - **`git checkout <hash-commit>` →** **Cambia** al commit especificado y te pone en un **estado** *(detached HEAD)*.
  - **`git checkout -b <nombre_rama>` →** **Crea** una nueva rama y **cambia** a ella directamente.
  - **`git checkout -- <archivo>` →** **Restaura** un archivo especifico al estado del **último commit** sin afectar otros archivos.
  - **`git checkout <hash-commit> -- <archivo>` →** **Restaura** un archivo especifico al estado de un **commit especifico** sin afectar otros archivos.
  - **`git checkout -` →** Un **atajo** equivalente al comando `git switch -`

---

<h3>Actualización y colaboración</h3>

```sh
git fetch <remoto>
```
**Descarga** los últimos cambios del **repositorio remoto**, pero no los aplica a tu rama actual hasta que no sea ejecuta el comando `git merge`.

- **Flags útiles del comando:**
  - **`git fetch <remoto> <rama>` →** **Descarga** solo una **rama** especifica del remoto.
  - **`git fetch --prune` →** Realiza una **limpieza** de referencias locales a las ramas remotas que ya no están en el repositorio remoto.
  - **`git fetch --dry-run` →** Realiza una **simulación** que te muestra qué cambios se descargarán del remoto sin **aplicarlos realmente**.

```sh
git merge <remoto>/<rama>
```
**Fusiona** los cambios de una rama con otro. Por lo general, se usa después de un `git fetch`, ya que ese comando **descarga** los cambios del repositorio remoto.

- **Flags útiles del comando:**
  - **`git merge --no-ff <rama>` →** **Fuerza** a crearse un **commit de merge**. Útil si quieres mantener un historial explícito de cuándo se realizó la fusión.
  - **`git merge --squash <rama>` →** **Combina** todos los commits de una rama en un **solo** commit al hacer la fusión. Tendrás que hacer el commit **manualmente** con `git commit -m <mensaje>`
  - **`git merge --abort` →** Permite **abortar** una fusión en curso si se detectan problemas, como **conflictos** que no puedes o no quieres resolver en ese momento.

```sh
git pull
```
**Descarga** los cambios del **repositorio remoto** y los **fusiona automáticamente** con tu rama actual. Es equivalente a `git fetch` seguido de `git merge`.

- **Flags útiles del comando:**
  - **`git pull <remoto> <rama>` →** **Descarga** y **fusiona** solo una **rama** especifica del remoto.
  - **`git pull --rebase` →** Descarga y fusiona, pero **reorganiza** los commits locales **encima de los cambios** traídos del remoto.
  - **`git pull --ff-only` →** Garantiza que no haya **conflictos** entre la rama local y la rama remota; si se detecta conflicto, el pull **fallará**.

```sh
git push
```
**Sube** los commits de la **rama actual** al repositorio remoto. Debes hacerlo después de realizar un **commit** para **compartir** tus cambios.

- **Flags útiles del comando:**
  - **`git push <remoto> <rama>` →** **Sube** el commit reciente de la **rama local especificada** al **remoto especificado**.
  - **`git push --force-with-lease` →** **Fuerza** el *push* si no hay **commits nuevos** en el remoto que no tengas **localmente**.
  - **`git push --dry-run` →** Realiza una **simulación** que te muestra los cambios que serán **subidos** al repositorio remoto.

> [!TIP]
> Flag extra `git push --set-upstream <remoto> <rama>`, se usa cuando creas una nueva rama local y quieres subirla al repositorio remoto por primera vez. Es útil porque establece tanto la rama remota como el siguimiento.

---

<h3>Resolución de problemas y revisión del historial</h3>

```sh
git diff <archivo>
```
**Muestra** los cambios del archivo especificado, entre el **estado actual** y los cambios que aún no han sido **confirmados**.

- **Flags útiles del comando:**
  - **`git diff <hash-commit1> <hash-commit2>` →** **Compara** las diferencias entre dos **commits especificados**.
  - **`git diff --name-only` →** Muestra **solamente** el nombre de los archivos **modificados**.
  - **`git diff --stat` →** Muestra un resumen **estadístico** de los cambios.


```sh
git restore <archivo>
```
**Quita** un archivo del área de preparación *(staging area)*, pero **mantiene** los cambios locales. Útil si accidentalmente hiciste `git add` en un archivo que no querías incluir en el commit.

- **Flags útiles del comando:**
  - **`git restore --source=<hash-commit> <archivo>` →** **Restaura** el archivo al estado de un **commit** especifico sin **afectar** al resto de los archivos.
  - **`git restore --worktree <archivo>` →** **Deshace** los cambios que has hecho y quede igual antes de cualquier **modificación**.

```sh
git reset <archivo>
```
**Deshace** los cambios no confirmados en un archivo, **restaurándolo** al estado del último commit.

- **Flags útiles del comando:**
  - **`git reset --soft <hash-commit>` →** **Restablece** el puntero *(HEAD)* al commit especificado, pero **mantiene todos los cambios** en el área de preparación *(staging area)*.
  - **`git reset --mixed <hash-commit>` →** **Restablece** el puntero *(HEAD)* al commit especificado, **elimina los cambios** en el área de preparación *(staging area)*, pero **mantiene los cambios locales**.
  - **`git reset --hard <hash-commit>` →** **Restablece completamente** el puntero *(HEAD)* al commit especificado **eliminando completamente todo los cambios**.

> [!CAUTION]
> El uso del flag **--hard** debe hacerse con extrema precaución dado que eliminará permanentemente todos los cambios no confirmados en el área de trabajo y el área de preparación.
