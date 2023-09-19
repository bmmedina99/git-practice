### RECOPILACIÓN BÁSICA: 12 COMANDOS ÚTILES DE GIT

---

Recopilación de comandos esenciales para usar Git, acompañados de concisas descripciones y variantes que apuntan hacia una camino para la gestión eficaz de los repositorios.

---

> {a} = Nombre autor | {c} = Commit-hash | {f} = Fichero | {m} = Mensaje | {r} = Rama
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

8. Actualiza el repositorio local con los cambios del repositorio remoto.

```sh
git pull
```
> *Estos comandos son los mismo que* **git pull**, *pero de una forma más controlada*
 
- **`git fetch` →** Descarga los cambios desde el repositorio remoto, pero no los aplica en local.
- **`git merge {b}` →** Fusiona los cambios descargados de la rama remota a la rama local actual.

9. Agrega el fichero especificado al área de preparación.

```sh
9. git add {f}
```
> *Entre las variantes de* **add** *tenemos las siguientes:*
 
- **`git add -A` →** Agrega todos los cambios, incluyendo archivos nuevos.
- **`git add -u` →** Agrega todos los cambios, pero omite los no rastreados.

*El comando* **add** *prepara los cambios realizados para la confirmación* **commit**

10. Remueve el fichero especificado del área de preparación.

```sh
git reset {f}
```
> *Entre las variantes de* **reset** *tenemos las siguientes:*

- **`git reset --soft {c}`** → Cambia al commit, converva los cambios y mantiene la confirmación.
- **`git reset --mixed {c}`** → Cambia al commit, converva los cambio y quita la confirmación.
- **`git reset --hard {c}`** → Cambia al commit quitando todos los cambios. **CUIDADO**

11. Realiza la confirmación de los cambios en el repositorio local con un mensaje breve.

```sh
git commit -m “{m}”
```
> *Entre las variantes de* **commit** *tenemos las siguientes:*

- **`git commit` →** Abrirá una editor para poner un mensaje más largo y descriptivo.
- **`git commit -am “{m}”` →** Confirma los cambios con un mensaje, omitiendo los no rastreados.
- **`git commit --amend` →** Permite modificar el mensaje de la confirmación más reciente.

12. Se utiliza para enviar los cambios confirmados del repositorio local a un remoto.

```sh
git push
```
> *Entre las variantes de* **push** *tenemos las siguientes:*

- **`git push {o} {r}`**  → Sube el commit de la rama local especificada a la rama remota.
- **`git push {o} :{r}` →** Elimina la rama remota especificada sin subir el commit.
- **`git push --all {o}` →** Sube todas las ramas locales al repositorio remoto.
