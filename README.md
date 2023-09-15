## Mi recopilación de 12 comandos útiles de Git.

---

> {a} = Autor | {ch} = Commit-hash | {b} = Rama | {f} = Fichero | {r} = Repositorio | {m} = Mensaje

Guía con comandos útiles los cuales he recopilado con una breve descripción y variantes.
```sh
1. git init → Inicializa el repositorio local de git.
``` 
```sh
2. git clone {r} → Crea una copia de un repositorio remoto en local.
``` 
```sh
3. git remote -v → Muestra una lista de repositorios remotos configurados.
``` 
```sh
4. git branch → Crea una nueva rama para el repositorio local.
```
> *Las variantes principales de* **branch** *son las siguientes:*

- **`git branch {r}`** → Creara una nueva rama con el nombre especificado.
- **`git branch -d {r}`** → Climina una rama local después de confirmar los cambios fusionados.
- **`git branch -a`** → Muestra todas las ramas, tanto locales como remotas.
- **`git branch -r`** → Muestra solo las ramas remotas.
- **`git branch -m {r}`** → Cambia el nombre de la rama actual.
- **`git branch --set-upstream-to=origin/{r} {r}`** → Vincula la rama local con la rama remoto.
```sh
5. git checkout → Se utiliza para cambiar de rama o para moverte entre diferentes puntos en Git.
``` 
> *Existen variantes útiles tales como las siguientes:*
 
- **`git checkout {r}`** → Cambia a la rama especificada, permitiéndote trabajar en esa rama.
- **`git checkout -b {r}`**  → Crea una nueva rama con el nombre especificado y cambia a ella.
- **`git checkout {ch}`**  → Se usa para ir a un punto específico del proyecto usando el hash.
```sh
6. git status → Muestra el estado de la rama en la que me encuentro.
``` 
> *Existen variantes a mencionar dentro del* **status***, como las siguientes:*

- **`git status -s`**  → Muestra el estado en un formato más compacto y legible.
    *Las letras en la columna izquierda indican el estado de los archivos:*

    - **`M`**: Modificado
    - **`A`**: Agregado (staged)
    - **`D`**: Eliminado
    - **`??`**: No rastreado (untracked)
- **`git status -v`**  → Proporciona información sobre los cambios realizados en los archivos
```sh
7. git log → Muestra el listado de los commits.
```
> *Algunas de las opciones y variantes más comunes de* **log** *incluyen:*
 
- **`git log -n`** → Muestra solo las últimas "n" *commits*.
- **`git log --oneline`** → Muestra cada *commit* en una sola línea.
- **`git log --graph`** → Muestra un gráfico ASCII que representa las ramas y fusiones.
- **`git log --author={a}`** → Muestra solo las *commit* realizadas por un autor específico.
```sh
8. git pull → Descarga los cambios del repositrio remoto y los fusiona con el local.
``` 
> *Estos comandos son los mismo que* **git pull**, *pero de una forma más controlada*
 
- **`git fetch`** → Descarga los cambios desde el repositorio remoto, pero no los aplica en local.
- **`git merge {b}`** → Fusiona los cambios descargados de la rama remota a la rama local actual.
```sh
9. git add {f} → Agrega cambios de archivos en local para la próxima confirmación.
``` 
> *Antes de realizar un* **commit** *usar antes* **add***, y sobre variantes tenemos las siguientes:*
 
- **`git add -A`** → Agrega todos los cambios, incluyendo archivos nuevos.
- **`git add -u`** → Agrega todos los cambios, pero omite los no rastreados.
```sh
10. git reset {f} → Deshace cambios de archivos en local y ajusta el estado de los archivos.
``` 
```sh
11. git commit → Realiza una subida de los archivos tomados del repositorio.
``` 
> *De forma obligatoria el* **commit** *siempre tendrá que llevar un* **-m** *para agregar mensaje.*
 
- **`git commit -m “{m}”`** → Realiza la confirmación para la subida con un mensaje.
- **`git commit -am “{m}”`** → Forma rápida de realizar un *add -u* y *commit -m* a la vez.
- **`git commit --amend`** → Permite modificar la confirmación anterior y reemplazar el mensaje.
```sh
12. **git push** → Se utiliza para enviar los cambios confirmados del repositorio local a un remoto.
``` 
> *NOTA:* **git push origin master** *lo que hacemos es enviar los cambios de nuestra rama local* **master** *a la rama remota* **master.** *La palabra* **origin** *es un control remoto generado por git que apunta al repositorio remoto.*
 
- **`git push origin {r}`**  → Se envía los cambios de la rama local especificada al repositorio remoto con el mismo nombre.
- **`git push origin :{r}`** → Se elimina la rama remota específicada en el repositorio remoto. (No afecta al local)
- **`git push --all origin`** → Envía todas las ramas locales al repositorio remoto.
