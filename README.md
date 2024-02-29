<h1 style="text-align:center;">RECOPILACIÓN BÁSICA: 15 COMANDOS ÚTILES DE GIT</h1>

![RECOPILACIÓN BÁSICA: 15 COMANDOS ÚTILES DE GIT](./img/banner-git.png)

---

Recopilación básica de 15 comandos útiles y esenciales para usar Git, acompañados de una breve, pero detallada explicación que te ayudarán en la gestión de tus repositorios.

---

Para empezar, debemos tener instalado **[Git](https://git-scm.com/download/)**. Una vez lo tenemos podrémos ejecutar los siguientes comandos iniciales:

**→** Se usa para asociar la dirección de correo a los *commits*.

```sh
git config --global user.email "micorreo@correo.com"
```

**→** Se usa para asociar el nombre del autor a los *commits*.

```sh
git config --global user.name "{a}"
```
> [!NOTE]
> La flag **--global** afecta globalmente a todos los repositorios locales. Si deseas que la configuración solo afecte al repositorio local actual omite dicha flag.

---

<h3>LEYENDA</h3>

![LEYENDA USADA PARA LOS COMANDOS](./img/legend-git.png)

<h3>COMANDOS</h3>

1. Crea un nuevo repositorio local en el directorio actual.

```sh
git init
```

2. Clona un repositorio remoto desde una URL especifica al repositorio local.

```sh
git clone {URL}
```
> *Entre las variantes de* **clone** *tenemos las siguientes:*

- **`git clone --branch {r} {URL}` →** Clona un repositorio remoto desde una rama.
- **`git clone --depth {nº} {URL}` →** Clona un repositorio remoto con n commits.
- **`git clone --mirror {URL}` →** Clona un repositorio remoto incluyendo referencias.

3. Muestra una lista de los repositorios remotos.

```sh
git remote
```
> *Entre las variantes de* **remote** *tenemos las siguientes:*

- **`git remote -v` →** Muestra una lista detallada incluyendo URL.
- **`git remote rename {o} {on}` →** Cambia el nombre del repositorio remoto.

*De forma predeterminada el* **repositorio remoto** *tendrá de nombre* **origin**

4. Muestra una lista de las ramas locales.

```sh
git branch
```
> *Entre las variantes de* **branch** *tenemos las siguientes:*

- **`git branch {r}` →** Crea una nueva rama con el nombre especificado.
- **`git branch -d {r}` →** Elimina una rama local, considerando cambios pendientes.
- **`git branch -m {r}` →** Cambia el nombre de la rama actual.
- **`git branch -r` →** Muestra una lista de las ramas remotas.
- **`git branch -a` →** Muestra una lsita de todas las ramas, locales y remotas.
- **`git branch -v` →** Muestra información adicional sobre las ramas locales.
- **`git branch -vv` →** Muestra información más detallada con relación a las ramas remotas.

5. Se utiliza para una variedad de tareas en Git.

```sh
git checkout
```
> *Entre las variantes del* **checkout** *tenemos los siguientes:*
 
- **`git checkout -b {r}` →** Crea una rama con el nombre especificado y cambia a ella.
- **`git checkout {r}` →** Cambia a la rama especificada, para trabajar en ella.
- **`git checkout {c}` →** Permite ir a un punto específico usando el commit-hash.
- **`git checkout -- {f}` →** Descarta los cambios no confirmados del fichero especificado.
- **`git checkout -` →** Cambia rápidamente a la rama en la que estabas antes.

6. Muestra el estado de la rama local.

```sh
git status
```
> *Entre las variantes de* **status** *tenemos las siguientes:*

- **`git status -s` →** Muestra el estado en un formato más compacto y legible.
    - **`M`**: Modificado
    - **`A`**: Agregado (staged)
    - **`D`**: Eliminado
    - **`??`**: No rastreado (untracked)
- **`git status -sb` →** Muestra información adicional con el estado de la rama.

7. Muestra el listado de los commits detalladamente.

```sh
git log
```
> *Entre las variantes de* **log** *tenemos las siguientes:*
 
- **`git log -n {nº}` →** Muestra únicamente los últimos nº commits.
- **`git log --oneline` →** Muestra todos los commits en una sola linea.
- **`git log --graph` →** Muestra un gráfico ASCII que representa las ramas y fusiones.
- **`git log --author={a}` →** Muestra únicamente los commits del autor especificado.

8. Descarga cambios del repositorio remoto a tu repositorio local sin fusionarlos automáticamente.

```sh
git fetch
```
> *Entre las variantes de* **fetch** *tenemos las siguientes:*

- **`git fetch --prune` →** Realiza una limpieza de referencias locales que no están en el repositorio remoto.
- **`git fetch {o}` →** Descarga cambios del repositorio remoto especificado en caso de tener más configurados.

9. Fusiona los cambios de una rama en otra, creando un nuevo commit de fusión si es necesario.

```sh
git merge {r}
```
> *Entre las variantes de* **merge** *tenemos las siguientes:*

- **`git merge --no-ff {r}` →** Realiza una fusión convencional, pero creará un nuevo commit de fusión.
- **`git merge --squash {r}` →** Realiza una fusión y junta todos los commits de la rama en uno solo.

10. Actualiza el repositorio local con los cambios del repositorio remoto.

```sh
git pull
```
> *Entre las variantes de* **pull** *tenemos las siguientes:*
 
- **`git pull {o} {r}` →** Descarga y fusiona el contenido de la rama remota en local.
- **`git pull --rebase {o} {r}` →** Descarga y fusiona reorganizando los commits; se pueden resolver conflictos durante la fusión si es necesario.
- **`git pull --ff-only {o} {r}` →** Descarga, fusiona y reorganiza, pero fallará si existe conflicto.

11. Agrega el fichero especificado al área de preparación.

```sh
git add {f}
```
> *Entre las variantes de* **add** *tenemos las siguientes:*
 
- **`git add -A` →** Agrega todos los cambios, incluyendo archivos nuevos.
- **`git add -u` →** Agrega todos los cambios, pero omite los no rastreados.

*El comando* **add** *envía los archivos al área de preparación (staging area)*

12. Deshace los cambios del archivo que aún no están en el área de preparación.

```sh
git restore {f}
```
> *Entre las variantes de* **reset** *tenemos las siguientes:*

- **`git restore --staged {f}` →** Deshace los cambios del archivo del área de preparación.
- **`git restore --source={c} {f}` →** Restaura el archivo al estado de un commit especifico.
- **`git restore --worktree {f}` →** Deshace los cambios del archivo y restaura el último commit.

13. Deshace los cambios del archivo que ya están en el área de preparación.

```sh
git reset {f}
```
> *Entre las variantes de* **reset** *tenemos las siguientes:*

- **`git reset --soft {c}` →** Cambia al commit, converva los cambios y mantiene la confirmación.
- **`git reset --mixed {c}` →** Cambia al commit, converva los cambio y quita la confirmación.
- **`git reset --hard {c}` →** Cambia al commit quitando todos los cambios. **CUIDADO**

14. Realiza la confirmación de los archivos del área de preparación con un mensaje breve.

```sh
git commit -m “{m}”
```
> *Entre las variantes de* **commit** *tenemos las siguientes:*

- **`git commit` →** Abrirá una editor para poner un mensaje más largo y descriptivo.
- **`git commit -am “{m}”` →** Confirma los cambios con un mensaje, omitiendo los no rastreados.
- **`git commit --amend` →** Permite modificar el mensaje de la confirmación más reciente.

15. Se utiliza para enviar los cambios confirmados del repositorio local a un remoto.

```sh
git push
```
> *Entre las variantes de* **push** *tenemos las siguientes:*

- **`git push {o} {r}` →** Sube el commit reciente Yde la rama local especificada a la rama remota.
- **`git push {o} :{r}` →** Elimina la rama remota especificada sin subir el commit.
- **`git push --all {o}` →** Sube todas las ramas locales al repositorio remoto.

---

### RECOPILACIÓN AVANZADA: 10 COMANDOS ÚTILES DE GIT

---

git rebase: Reescribe el historial de commits, lo que puede ayudar a mantener un historial más limpio y lineal en lugar de tener múltiples fusiones.

git cherry: Se utiliza para mostrar los commits que existen en una rama pero no en otra.

git cherry-pick: Permite seleccionar y aplicar un commit específico de una rama a otra, lo que es útil para la incorporación selectiva de cambios.

git stash: Temporalmente guarda cambios locales no comprometidos en una pila para que puedas cambiar de rama o realizar otras operaciones sin necesidad de confirmarlos.

git bisect: Ayuda a encontrar el commit que introdujo un error mediante una búsqueda binaria automatizada, lo que facilita la identificación de problemas.

git submodule: Permite gestionar submódulos en un repositorio, lo que es útil cuando deseas incluir otros repositorios dentro de tu proyecto.

git filter-branch: Útil para reescribir el historial de commits, eliminar archivos sensibles o realizar otras operaciones avanzadas en el historial.

git blame: Muestra quién modificó por última vez cada línea de un archivo, lo que es útil para rastrear la autoría de cambios específicos.

git reflog: Muestra un registro detallado de todas las operaciones realizadas en el repositorio, lo que puede ser útil para recuperar cambios perdidos.

git worktree: Permite trabajar con múltiples copias de trabajo independientes en un solo repositorio, lo que es útil para trabajar en diferentes características o versiones de tu proyecto al mismo tiempo.

git hooks: Son scripts personalizables que puedes ejecutar en eventos específicos de Git, como pre-commit o post-merge, para automatizar tareas personalizadas en tu flujo de trabajo.
