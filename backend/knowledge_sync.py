# knowledge_sync.py

import os
import asyncio
from typing import Optional

import requests


class OWKnowledgeSync:
    """
    구글 공유 문서(또는 기타 텍스트 URL)에서
    오버워치 배경 지식을 주기적으로 가져와
    로컬 텍스트 파일로 동기화하는 클래스.

    - 실제 LLM 호출은 항상 로컬 파일만 읽어 사용하므로,
      동기화 실패 시에도 서비스는 계속 동작한다.
    """

    def __init__(
        self,
        url: Optional[str] = None,
        path: str = "overwatch_knowledge.txt",
        interval_sec: int = 600,
        timeout_sec: int = 5,
    ) -> None:
        # URL을 명시적으로 넘기지 않으면 환경변수에서 가져옴
        self.url = url or os.getenv("OW_KNOWLEDGE_URL")
        self.path = path
        self.interval_sec = interval_sec
        self.timeout_sec = timeout_sec

    @property
    def enabled(self) -> bool:
        """URL이 설정되어 있을 때만 동기화를 활성화."""
        return bool(self.url)

    def _write_atomic(self, content: str) -> None:
        """
        텍스트 파일을 안전하게 교체하기 위한 유틸.
        임시 파일에 먼저 쓰고, os.replace 로 원자적으로 교체한다.
        """
        tmp_path = self.path + ".tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            f.write(content)
        os.replace(tmp_path, self.path)

    def sync_once(self) -> None:
        """
        한 번만 원격에서 텍스트를 가져와 로컬 파일에 반영.
        (동기 함수, startup 시 초기 1회 동기화에 사용 가능)
        """
        if not self.enabled:
            return

        resp = requests.get(self.url, timeout=self.timeout_sec)
        resp.raise_for_status()
        text = resp.text
        self._write_atomic(text)

    async def run_loop(self) -> None:
        """
        주기적으로 sync_once()를 호출하는 비동기 루프.
        FastAPI startup 이벤트에서 asyncio.create_task(...)로 실행.
        """
        if not self.enabled:
            print("[OW_KNOWLEDGE] OW_KNOWLEDGE_URL not set. Sync loop disabled.")
            return

        print(
            f"[OW_KNOWLEDGE] Background sync loop started. "
            f"interval={self.interval_sec}s, url={self.url}"
        )

        while True:
            try:
                self.sync_once()
                print("[OW_KNOWLEDGE] Updated overwatch_knowledge.txt from remote.")
            except Exception as e:
                print(f"[OW_KNOWLEDGE] Sync failed: {e}")

            await asyncio.sleep(self.interval_sec)
