"""Provider-agnostic LLM client that returns a JSON object.

LLM_PROVIDER=anthropic uses the Anthropic API with a forced tool call;
LLM_PROVIDER=openai_compatible talks to any OpenAI-style endpoint
(Groq, OpenRouter, a local Ollama) with an open-source model.
"""

import json

import httpx

from app import config


class LLMUnavailable(Exception):
    pass


def is_configured() -> bool:
    if config.LLM_PROVIDER == "anthropic":
        return bool(config.ANTHROPIC_API_KEY)
    if config.LLM_PROVIDER == "openai_compatible":
        return bool(config.OPENAI_COMPAT_BASE_URL and config.OPENAI_COMPAT_MODEL)
    return False


def complete_json(system: str, user: str, schema: dict, tool_name: str) -> dict:
    if not is_configured():
        raise LLMUnavailable("no LLM provider configured")
    try:
        if config.LLM_PROVIDER == "anthropic":
            return _anthropic(system, user, schema, tool_name)
        return _openai_compatible(system, user, schema)
    except LLMUnavailable:
        raise
    except Exception as exc:  # network, auth, rate limit, bad JSON
        raise LLMUnavailable(str(exc)) from exc


def _anthropic(system: str, user: str, schema: dict, tool_name: str) -> dict:
    import anthropic

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY, timeout=30.0)
    msg = client.messages.create(
        model=config.ANTHROPIC_MODEL,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": user}],
        tools=[{"name": tool_name, "description": "Return the result.", "input_schema": schema}],
        tool_choice={"type": "tool", "name": tool_name},
    )
    for block in msg.content:
        if block.type == "tool_use":
            return dict(block.input)
    raise LLMUnavailable("model returned no tool call")


def _openai_compatible(system: str, user: str, schema: dict) -> dict:
    res = httpx.post(
        f"{config.OPENAI_COMPAT_BASE_URL.rstrip('/')}/chat/completions",
        headers={"Authorization": f"Bearer {config.OPENAI_COMPAT_API_KEY}"},
        json={
            "model": config.OPENAI_COMPAT_MODEL,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": f"{system}\n\nReply with one JSON object matching this schema:\n{json.dumps(schema)}"},
                {"role": "user", "content": user},
            ],
        },
        timeout=30.0,
    )
    res.raise_for_status()
    return json.loads(res.json()["choices"][0]["message"]["content"])
