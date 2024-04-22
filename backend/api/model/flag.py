from enum import Enum

from pydantic import BaseModel


# class FlagState(str, Enum):
#     put = "put" # PUT запущен
#     get = "get" # GET запущен
    
#     ok = "ok" # флаг попал на машину
#     fail = "fail" # флаг не попал на машину


# class Flag(BaseModel):
#     flag: str
#     state: FlagState | None
