from typing import Literal, TypedDict

AttachmentStatus = Literal["received"]
AttachmentContentStatus = Literal["content_received"]


class AttachmentIntakeRequest(TypedDict, total=False):
    attachmentId: str
    attachmentKind: str
    attachmentName: str
    attachmentSizeBytes: int
    attachmentType: str
    conversationId: str
    source: str
    text: str


class AttachmentUploadRequest(TypedDict, total=False):
    attachmentId: str
    attachmentKind: str
    attachmentName: str
    attachmentType: str
    base64Content: str
    conversationId: str
    source: str
    text: str


class AttachmentIntake(TypedDict, total=False):
    id: str
    attachmentId: str
    conversationId: str
    kind: str
    name: str
    sizeBytes: int
    source: str
    status: AttachmentStatus
    contentSha256: str
    contentStatus: AttachmentContentStatus
    text: str
    type: str
    createdAt: str
