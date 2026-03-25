#!/usr/bin/env python3
"""Gera src/data/courses.ts a partir de src/data/todos-os-cursos.csv."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "src/data/todos-os-cursos.csv"
OUT_PATH = ROOT / "src/data/courses.ts"

FIRST = {
    "trilha": "Onboarding",
    "titulo": "Comece por aqui",
    "sinopse": "Assista antes de começar: orientação inicial para aproveitar a plataforma e sua jornada.",
    "link": "https://app.agenze.io/c/veja-isso-antes-de-comecar/",
    "basica": False,
    "obrigatoria": True,
    "exclusivoPro": False,
}


def ts_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def row_to_obj(trilha, titulo, sinopse, link, basica, obrigatoria, exclusivo_pro):
    return {
        "trilha": trilha.strip(),
        "titulo": titulo.strip(),
        "sinopse": sinopse.strip(),
        "link": link.strip(),
        "basica": basica.strip().upper() == "TRUE",
        "obrigatoria": obrigatoria.strip().upper() == "TRUE",
        "exclusivoPro": exclusivo_pro.strip().upper() == "TRUE",
    }


def emit_course(o: dict) -> str:
    return f"""  {{
    trilha: {ts_str(o["trilha"])},
    titulo: {ts_str(o["titulo"])},
    sinopse: {ts_str(o["sinopse"])},
    link: {ts_str(o["link"])},
    basica: {str(o["basica"]).lower()},
    obrigatoria: {str(o["obrigatoria"]).lower()},
    exclusivoPro: {str(o["exclusivoPro"]).lower()},
  }}"""


def main():
    rows = [FIRST.copy()]
    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(
                row_to_obj(
                    r["COURSE (TRILHA)"],
                    r["NOME DA AULA"],
                    r["SINOPSE"],
                    r["LINK DA AULA"],
                    r["AULAS BÁSICAS"],
                    r["AULAS OBRIGATÓRIAS"],
                    r["EXCLUSIVO PRO"],
                )
            )

    blocks = ",\n".join(emit_course(o) for o in rows)

    content = f"""export interface Course {{
  trilha: string
  titulo: string
  sinopse: string
  link: string
  /** Conteúdo introdutório — usar no plano só para perfil muito iniciante (P0). */
  basica: boolean
  /** Deve constar em todo plano (exceto aulas Pro). */
  obrigatoria: boolean
  /** Conta na biblioteca total, mas nunca entra no plano personalizado. */
  exclusivoPro: boolean
}}

export const COURSES: Course[] = [
{blocks}
]

/** Total de linhas no catálogo (inclui Exclusivo Pro — não entram todas no plano). */
export const LIBRARY_LESSON_COUNT = COURSES.length
"""
    OUT_PATH.write_text(content, encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(rows)} cursos)")


if __name__ == "__main__":
    main()
