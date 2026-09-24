# Para actualizar la norma (sin saber informática)

La app **no** se actualiza sola cuando sale un boletín. GitHub te **recuerda** y la IA hace el trabajo técnico.

## Qué tienes que hacer tú

1. Cuando llegue el recordatorio (issue **Pack temporada**), abre **Cursor**.
2. Lanza un **Cloud Agent** en este repositorio.
3. Copia el **prompt** que viene en la propia issue (o el de abajo).
4. Cuando la IA abra un **Pull Request**, míralo y apruébalo / fusiónalo si está bien.
5. Si usas la web (GitHub Pages), al fusionar a `main` se publica sola.

### Prompt listo

```
Sigue .github/agents/PACK_TEMPORADA.md para la temporada de este año (o el año que diga la issue).
Revisa Castellón, Sevilla, Córdoba y Cuenca. Actualiza norma y mapas. Pasa npm run assert. Abre PR.
```

## Qué hace el sistema solo

- **Nov / dic–feb / jun:** GitHub abre (o recuerda) la issue de temporada.
- **En cada PR:** se ejecutan las comprobaciones (`npm run assert`).
- **Al fusionar a main:** se publica la web.

## Qué no es automático (y no debe serlo)

Leer el boletín oficial y decidir qué cambia en cotos/vedas: eso lo hace la IA **con revisión tuya**, no un robot a ciegas.
