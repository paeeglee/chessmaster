"""Imprime o schema OpenAPI sem subir o servidor (usado por make generate-api-types)."""

import json
import sys

from game_analyzer.main import create_app


def main() -> None:
    json.dump(create_app().openapi(), sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
