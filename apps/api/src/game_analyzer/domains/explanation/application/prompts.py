"""Prompts versionados (arquivos em prompts/), preenchidos com o contrato."""

from dataclasses import dataclass
from importlib.resources import files

from game_analyzer.domains.explanation.domain.contract import GameContract, Level, MoveContract

LEVEL_RULES: dict[Level, str] = {
    "beginner": "Nível Iniciante: sem jargão; quando usar um termo técnico, explique-o.",
    "intermediate": "Nível Intermediário: termos táticos são permitidos.",
    "advanced": "Nível Avançado: pode citar linhas mais longas e termos técnicos.",
}

_USER_MARKER = "---user---"


@dataclass(frozen=True)
class Prompt:
    system: str
    user: str


def load_prompt(name: str, version: int = 1) -> tuple[str, str]:
    """Lê `prompts/<name>.v<version>.md` e separa as mensagens de sistema e de usuário."""
    text = (
        files("game_analyzer.domains.explanation")
        .joinpath(f"prompts/{name}.v{version}.md")
        .read_text(encoding="utf-8")
    )
    system, user = text.split(_USER_MARKER, maxsplit=1)
    return system.strip(), user.strip()


def render_prompt(
    name: str, contract: GameContract | MoveContract, *, feedback: str = "", question: str = ""
) -> Prompt:
    system, user = load_prompt(name)
    values = {
        "{{level_rules}}": LEVEL_RULES[contract.level],
        "{{contract_json}}": contract.model_dump_json(indent=2),
        "{{feedback}}": feedback or "Nenhuma.",
        "{{question}}": question,
    }
    for placeholder, value in values.items():
        system = system.replace(placeholder, value)
        user = user.replace(placeholder, value)
    return Prompt(system=system, user=user)
