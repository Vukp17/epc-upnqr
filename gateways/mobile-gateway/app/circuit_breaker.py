"""
Circuit Breaker pattern implementation for the mobile-gateway.

States:
  CLOSED    – normal operation; failures are counted.
  OPEN      – upstream is considered down; requests fail fast without a network
               call.  After `recovery_timeout` seconds the breaker moves to
               HALF_OPEN.
  HALF_OPEN – one probe request is allowed through.  A success resets the
               breaker to CLOSED; a failure sends it back to OPEN.
"""

import time
from enum import Enum
from threading import Lock


class State(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitOpenError(Exception):
    """Raised when a call is attempted while the circuit is OPEN."""


class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        success_threshold: int = 2,
        name: str = "default",
    ) -> None:
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.success_threshold = success_threshold

        self._state = State.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: float = 0.0
        self._lock = Lock()

    # ── State queries ──────────────────────────────────────────────────────────

    @property
    def state(self) -> State:
        with self._lock:
            return self._state

    def allow_request(self) -> bool:
        """Return True if a request may proceed; transition OPEN→HALF_OPEN when
        the recovery window has elapsed."""
        with self._lock:
            if self._state == State.OPEN:
                if time.monotonic() - self._last_failure_time >= self.recovery_timeout:
                    self._state = State.HALF_OPEN
                    self._success_count = 0
                    return True
                return False
            return True

    # ── Outcome recording ──────────────────────────────────────────────────────

    def record_success(self) -> None:
        with self._lock:
            if self._state == State.HALF_OPEN:
                self._success_count += 1
                if self._success_count >= self.success_threshold:
                    self._state = State.CLOSED
                    self._failure_count = 0
            elif self._state == State.CLOSED:
                self._failure_count = 0

    def record_failure(self) -> None:
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = time.monotonic()
            if self._state in (State.CLOSED, State.HALF_OPEN):
                if self._failure_count >= self.failure_threshold:
                    self._state = State.OPEN

    # ── Introspection ──────────────────────────────────────────────────────────

    def status(self) -> dict:
        with self._lock:
            seconds_until_probe: float | None = None
            if self._state == State.OPEN:
                elapsed = time.monotonic() - self._last_failure_time
                remaining = self.recovery_timeout - elapsed
                seconds_until_probe = round(max(remaining, 0.0), 1)

            return {
                "name": self.name,
                "state": self._state,
                "failure_count": self._failure_count,
                "failure_threshold": self.failure_threshold,
                "success_count": self._success_count,
                "success_threshold": self.success_threshold,
                "recovery_timeout_s": self.recovery_timeout,
                "seconds_until_probe": seconds_until_probe,
            }
