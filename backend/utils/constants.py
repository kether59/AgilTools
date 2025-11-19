from enum import Enum

class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class UserRole(str, Enum):
    FACILITATOR = "facilitator"
    PARTICIPANT = "participant"

VALID_VOTES = ["0", "0.5", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"]