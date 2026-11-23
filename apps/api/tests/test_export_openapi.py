import json

import pytest

from game_analyzer.export_openapi import main


def test_prints_openapi_schema_without_a_server(capsys: pytest.CaptureFixture[str]) -> None:
    main()

    schema = json.loads(capsys.readouterr().out)
    assert schema["paths"]["/api/health"]["get"]["responses"]["200"]
