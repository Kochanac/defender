
from pydantic import BaseModel
from enum import Enum

class MachineState(str, Enum):
	starting = "starting"
	on = "on"
	turning_off = "turning_off"
	off = "off"
	removing = "removing"



class Machine(BaseModel):
	name: str
	state: MachineState
	hostname: str | None # ip


