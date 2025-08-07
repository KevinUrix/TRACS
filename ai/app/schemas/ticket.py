from pydantic import BaseModel
from typing import Optional

# -------------
# SERVICIO: CLASE PARA LA CREACIÓN DEL TICKET.
# EN CASO DE QUE MODIFIQUEN LOS CAMPOS DEL TICKET PARA AGREGAR MÁS, MODIFIQUEN ESTO
# -----------------
class TicketInput(BaseModel):
  building: Optional[str]
  room: Optional[str]
  title: Optional[str]
  report: str
