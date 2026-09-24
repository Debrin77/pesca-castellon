---
name: Pack norma de temporada
about: Actualizar vedas, anexos y cartografía cuando salga una orden nueva
title: "Pack temporada YYYY — revisar norma por provincia"
labels: ["pack-temporada"]
---

## Para ti (sin ser informático)

1. Cuando GitHub abra esta issue (o la crees tú), **no hace falta editar código**.
2. Abre **Cursor → Agents (Cloud)** en este repo.
3. Pega el bloque de abajo y envíalo.
4. Revisa el PR que prepare la IA y aprueba si tiene sentido.
5. Listo: la app se actualiza al publicar.

### Prompt para pegar en Cursor Agent

```
Sigue el playbook .github/agents/PACK_TEMPORADA.md
Temporada objetivo: YYYY
Issue: esta misma.

1) Revisa BO/DOGV/BOJA/DOCM de Castellón, Sevilla, Córdoba y Cuenca.
2) Actualiza el pack de norma + sync de mapas si hace falta.
3) Pasa npm run assert y npm run season:briefing.
4) Abre PR a main con resumen claro de qué cambió y qué se confirmó vigente.
```

Sustituye `YYYY` por el año de la temporada (ej. 2027).

---

## Checklist (la IA lo rellena)

- [ ] Castellón (GVA / DOGV / ICV)
- [ ] Sevilla (BOJA / DERA)
- [ ] Córdoba (BOJA / DERA)
- [ ] Cuenca (DOCM / Orden vedas CLM)
- [ ] Marítimo Castellón si aplica (vedados / PescaREC)
- [ ] `vigenciaNota` y enlaces oficiales al día
- [ ] `npm run sync:*` si cambió cartografía
- [ ] `npm run assert` OK
- [ ] PR abierto
