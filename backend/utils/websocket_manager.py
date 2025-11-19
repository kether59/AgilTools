from fastapi import WebSocket

class WebSocketManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, session_code: str, username: str):
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = {}
        self.active_connections[session_code][username] = websocket

    def disconnect(self, session_code: str, username: str):
        if session_code in self.active_connections:
            if username in self.active_connections[session_code]:
                del self.active_connections[session_code][username]
            if not self.active_connections[session_code]:
                del self.active_connections[session_code]

    async def broadcast(self, message: dict, session_code: str):
        if session_code in self.active_connections:
            disconnected = []
            for username, connection in self.active_connections[session_code].items():
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(username)

            for username in disconnected:
                self.disconnect(session_code, username)


manager = WebSocketManager()