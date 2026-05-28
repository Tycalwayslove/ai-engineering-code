from typing import Protocol, TypeVar

T = TypeVar("T")
T_co = TypeVar("T_co", covariant=True)


class ContextProvider(Protocol[T_co]):
    def get(self, conversation_id: str, current_input: str) -> T_co: ...


class StaticContextProvider[T]:
    def __init__(self, value: T) -> None:
        self._value = value

    def get(self, conversation_id: str, current_input: str) -> T:
        return self._value
