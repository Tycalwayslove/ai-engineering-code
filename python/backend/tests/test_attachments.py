from backend.app.domains.attachment.context_provider import AttachmentSummaryProvider
from backend.app.domains.attachment.repository import InMemoryAttachmentIntakeRepository
from backend.app.main import app
from fastapi.testclient import TestClient


def test_attachment_intake_records_native_metadata() -> None:
    client = TestClient(app)

    response = client.post(
        "/attachments/intake",
        json={
            "attachmentId": "native_attachment_001",
            "attachmentKind": "image",
            "attachmentName": "receipt.jpg",
            "attachmentSizeBytes": 245678,
            "attachmentType": "public.jpeg",
            "conversationId": "conversation_attachment_001",
            "source": "native.composer.attachment.photo",
            "text": "已选择附件：receipt.jpg（image，245678 bytes）。",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"].startswith("attachment_")
    assert body["attachmentId"] == "native_attachment_001"
    assert body["conversationId"] == "conversation_attachment_001"
    assert body["kind"] == "image"
    assert body["name"] == "receipt.jpg"
    assert body["sizeBytes"] == 245678
    assert body["type"] == "public.jpeg"
    assert body["source"] == "native.composer.attachment.photo"
    assert body["status"] == "received"
    assert body["createdAt"]


def test_attachment_upload_decodes_text_content_for_context() -> None:
    client = TestClient(app)

    response = client.post(
        "/attachments/upload",
        json={
            "attachmentId": "native_attachment_upload_001",
            "attachmentKind": "file",
            "attachmentName": "receipt.txt",
            "attachmentType": "text/plain",
            "base64Content": "5Ye656ef6YeR6aKdIDg4LjUg5YWD",
            "conversationId": "conversation_attachment_upload_001",
            "source": "h5.composer.attachment.upload",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["attachmentId"] == "native_attachment_upload_001"
    assert body["conversationId"] == "conversation_attachment_upload_001"
    assert body["contentStatus"] == "content_received"
    assert body["contentSha256"] == (
        "7d709f6081736d91cbc779942478db2f43dda282d1bc0542dd92fe3d791551cc"
    )
    assert body["sizeBytes"] == 21
    assert body["text"] == "出租金额 88.5 元"

    list_response = client.get(
        "/attachments",
        params={"conversationId": "conversation_attachment_upload_001"},
    )
    assert list_response.status_code == 200
    assert list_response.json()[0]["text"] == "出租金额 88.5 元"


def test_attachment_upload_combines_native_display_text_with_decoded_text() -> None:
    client = TestClient(app)

    response = client.post(
        "/attachments/upload",
        json={
            "attachmentId": "native_attachment_upload_with_text_001",
            "attachmentKind": "file",
            "attachmentName": "receipt.txt",
            "attachmentType": "text/plain",
            "base64Content": "5Y+R56WoIOmHkeminSA4OC41IOWFgw==",
            "conversationId": "conversation_attachment_upload_with_text",
            "source": "native.composer.attachment.file",
            "text": "已选择附件：receipt.txt（file，文本票据）。",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["text"] == (
        "已选择附件：receipt.txt（file，文本票据）。\n"
        "识别文本：发票 金额 88.5 元"
    )


def test_list_attachments_returns_recent_intakes_for_conversation() -> None:
    client = TestClient(app)

    for index, conversation_id in enumerate(
        [
            "conversation_attachment_list_001",
            "conversation_attachment_list_001",
            "conversation_attachment_list_other",
        ],
    ):
        response = client.post(
            "/attachments/intake",
            json={
                "attachmentId": f"native_attachment_list_{index}",
                "attachmentKind": "image",
                "attachmentName": f"receipt-{index}.jpg",
                "conversationId": conversation_id,
                "source": "native.composer.attachment.photo",
            },
        )
        assert response.status_code == 200

    response = client.get(
        "/attachments",
        params={"conversationId": "conversation_attachment_list_001"},
    )

    assert response.status_code == 200
    body = response.json()
    assert [attachment["name"] for attachment in body] == [
        "receipt-0.jpg",
        "receipt-1.jpg",
    ]
    assert all(
        attachment["conversationId"] == "conversation_attachment_list_001"
        for attachment in body
    )


def test_attachment_summary_includes_sanitized_readable_text() -> None:
    repository = InMemoryAttachmentIntakeRepository()
    repository.create_intake(
        {
            "attachmentId": "native_attachment_text_001",
            "conversationId": "conversation_attachment_summary_text",
            "createdAt": "2026-05-28T10:00:00+08:00",
            "id": "attachment_text_001",
            "kind": "image",
            "name": "receipt.jpg",
            "status": "received",
            "text": "出租车发票; 合计 88.5 元\n日期 2026-05-20",
        }
    )

    summary = AttachmentSummaryProvider(repository).get(
        "conversation_attachment_summary_text",
        "",
    )

    assert summary == [
        (
            "attachment_id=attachment_text_001; "
            "native_attachment_id=native_attachment_text_001; "
            "name=receipt.jpg; kind=image; status=received; "
            "text=出租车发票 合计 88.5 元 日期 2026-05-20"
        )
    ]
