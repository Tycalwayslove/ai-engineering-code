from typing import Literal, TypedDict

ExpenseStatus = Literal["draft", "submitted", "canceled"]


class ExpenseRecord(TypedDict):
    id: str
    title: str
    amount: float
    currency: str
    occurredOn: str
    status: ExpenseStatus
    sourceActionId: str


class ExpenseRecordUpdate(TypedDict, total=False):
    title: str
    amount: float
    currency: str
    occurredOn: str
