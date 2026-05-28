from os import environ
from pathlib import Path


def load_env_local(filename: str = ".env.local") -> None:
    if environ.get("AI_CODE_LOAD_ENV_LOCAL", "1").lower() in ("0", "false", "no"):
        return

    env_path = _find_env_file(filename)
    if env_path is None:
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        parsed = _parse_env_line(raw_line)
        if parsed is None:
            continue
        key, value = parsed
        environ.setdefault(key, value)


def _find_env_file(filename: str) -> Path | None:
    start = Path.cwd()
    for directory in (start, *start.parents):
        env_path = directory / filename
        if env_path.is_file():
            return env_path
    return None


def _parse_env_line(raw_line: str) -> tuple[str, str] | None:
    line = raw_line.strip()
    if line == "" or line.startswith("#"):
        return None
    if line.startswith("export "):
        line = line.removeprefix("export ").strip()
    if "=" not in line:
        return None

    key, value = line.split("=", 1)
    key = key.strip()
    if key == "":
        return None

    return key, _unquote(value.strip())


def _unquote(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        return value[1:-1]
    return value
