import pytest

from game_analyzer.domains.explanation.domain.contract import GameContract


def reference_contract_data() -> dict[str, object]:
    """Trecho do contrato da partida de referência (pretas), com os lances citados."""
    moves = [
        (23, "12.Ce2", "Ce2"),
        (24, "12...Bxa1", "Bxa1"),
        (44, "22...Ta7", "Ta7"),
        (45, "23.Txa1", "Txa1"),
        (54, "27...Tb7", "Tb7"),
        (55, "28.Rxg4", "Rxg4"),
        (82, "41...Ta1", "Ta1"),
        (86, "43...Te6", "Te6"),
        (112, "56...Ta8", "Ta8"),
        (144, "72...Ta6#", "Ta6#"),
    ]
    return {
        "level": "beginner",
        "priorities": ["lost-pieces", "endgames"],
        "player_color": "b",
        "result": "0-1",
        "termination": "checkmate",
        "outcome_for_player": "win",
        "total_moves": 72,
        "moves": [{"ply": ply, "label": label, "san": san} for ply, label, san in moves],
        "material_timeline": [0, 0, 5, 8, 5, 3, 0],
        "advantage_started_at": {"ply": 24, "label": "12...Bxa1"},
        "key_moments": [
            {
                "ply": 44,
                "move_label": "22...Ta7",
                "mistake_type": "hanging-piece",
                "lost_piece": {"type": "b", "square": "a1"},
                "best_move": "Bd4+",
                "loss": 3,
            },
            {
                "ply": 54,
                "move_label": "27...Tb7",
                "mistake_type": "hanging-piece",
                "lost_piece": {"type": "b", "square": "g4"},
                "best_move": "Be2",
                "loss": 3,
            },
        ],
        "opponent_mistakes": [
            {
                "ply": 23,
                "move_label": "12.Ce2",
                "lost_piece": {"type": "r", "square": "a1"},
                "loss": 5,
            }
        ],
        "strengths": [
            {
                "ply": 24,
                "move_label": "12...Bxa1",
                "won_piece": {"type": "r", "square": "a1"},
                "gain": 5,
            }
        ],
        "patterns": [
            {"mistake_type": "hanging-piece", "count": 2, "move_labels": ["22...Ta7", "27...Tb7"]}
        ],
    }


@pytest.fixture
def contract() -> GameContract:
    return GameContract.model_validate(reference_contract_data())
