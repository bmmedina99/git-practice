### RECOPILACIÓN BÁSICA: 15 COMANDOS ÚTILES DE GIT

---

Recopilación de comandos esenciales para usar Git, acompañados de concisas descripciones y variantes que apuntan hacia una camino para la gestión eficaz de los repositorios.

---

> {a} = Nombre autor | {c} = Commit-hash | {f} = Fichero | {m} = Mensaje | {r} = Rama |
> {o} = Repositorio remoto | {on} = Nombre nuevo remoto

*Comandos para antes de empezar a usar Git, sirven para identificar al autor de los commits:*

**→** Se utiliza para configurar la dirección de correo asociada a los commits. 
**NOTA:** Recomendable utilizar la misma dirección de correo en Git que en GitHub.

```sh
git config --global user.email "micorreo@correo.com"
```

**→** Se utiliza para configurar el nombre del autor asociado a los commits.

```sh
git config --global user.name "{a}"
```

> *El uso del* **--global** *es la configuración global la cual será aplicada de forma predeterminada a todos repositorios locales.*

---

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

**`git merge --no-ff {r}` →** Realiza una fusión convencional, pero creará un nuevo commit de fusión.
**`git merge --squash {r}` →** Realiza una fusión y junta todos los commits de la rama en uno solo.

10. Actualiza el repositorio local con los cambios del repositorio remoto.

```sh
git pull
```
> *Entre las variantes de* **pull** *tenemos las siguientes:*
 
- **`git pull {o} {r}` →** Descarga y fusiona el contenido de la rama remota en local.
- **`git pull --rebase {o} {r}` →** Descarga y fusiona reorganizando los commits; se pueden resolver conflictos durante la fusión si es necesario.
- **`git pull --ff-only {o} {r}` →** Descarga, fusiona y reorganiza, pero fallará si existe conflicto.

9. Agrega el fichero especificado al área de preparación.

```sh
11. git add {f}
```
> *Entre las variantes de* **add** *tenemos las siguientes:*
 
- **`git add -A` →** Agrega todos los cambios, incluyendo archivos nuevos.
- **`git add -u` →** Agrega todos los cambios, pero omite los no rastreados.

*El comando* **add** *envía los archivos al área de preparación (staging area)*

13. Deshace los cambios del archivo que aún no están en el área de preparación.

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
