import uuid
from datetime import datetime

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# Production Models


class ProductionLineBase(SQLModel):
    name: str = Field(max_length=255, index=True)
    status: str = Field(default="idle", max_length=50)
    target_output: int = Field(default=0)


class ProductionLineCreate(ProductionLineBase):
    pass


class ProductionLineUpdate(ProductionLineBase):
    name: str | None = Field(default=None, max_length=255)
    status: str | None = Field(default=None, max_length=50)
    target_output: int | None = None


class ProductionLine(ProductionLineBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    stations: list["Station"] = Relationship(back_populates="line", cascade_delete=True)
    anomalies: list["Anomaly"] = Relationship(
        back_populates="line", cascade_delete=True
    )


class StationBase(SQLModel):
    name: str = Field(max_length=255)
    type: str = Field(max_length=50)
    line_id: uuid.UUID = Field(foreign_key="productionline.id")


class StationCreate(StationBase):
    pass


class StationUpdate(StationBase):
    name: str | None = Field(default=None, max_length=255)
    type: str | None = Field(default=None, max_length=50)
    line_id: uuid.UUID | None = None


class Station(StationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    line: ProductionLine = Relationship(back_populates="stations")
    defect_records: list["DefectRecord"] = Relationship(
        back_populates="station", cascade_delete=True
    )
    anomalies: list["Anomaly"] = Relationship(
        back_populates="station", cascade_delete=True
    )


class DefectRecordBase(SQLModel):
    type: str = Field(max_length=50)
    severity: str = Field(max_length=20)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    station_id: uuid.UUID = Field(foreign_key="station.id")


class DefectRecordCreate(DefectRecordBase):
    pass


class DefectRecordUpdate(DefectRecordBase):
    type: str | None = Field(default=None, max_length=50)
    severity: str | None = Field(default=None, max_length=20)
    timestamp: datetime | None = None
    station_id: uuid.UUID | None = None


class DefectRecord(DefectRecordBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    station: Station = Relationship(back_populates="defect_records")


# Sinan Models


class AnomalyBase(SQLModel):
    description: str = Field(max_length=500)
    status: str = Field(default="open", max_length=50)
    severity: str = Field(default="low", max_length=20)
    line_id: uuid.UUID = Field(foreign_key="productionline.id")
    station_id: uuid.UUID = Field(foreign_key="station.id")


class AnomalyCreate(AnomalyBase):
    pass


class AnomalyUpdate(AnomalyBase):
    description: str | None = Field(default=None, max_length=500)
    status: str | None = Field(default=None, max_length=50)
    severity: str | None = Field(default=None, max_length=20)
    line_id: uuid.UUID | None = None
    station_id: uuid.UUID | None = None


class Anomaly(AnomalyBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    line: ProductionLine = Relationship(back_populates="anomalies")
    station: Station = Relationship(back_populates="anomalies")
    diagnoses: list["Diagnosis"] = Relationship(
        back_populates="anomaly", cascade_delete=True
    )


class DiagnosisBase(SQLModel):
    root_cause: str = Field(max_length=500)
    confidence: float = Field(default=0.0)
    anomaly_id: uuid.UUID = Field(foreign_key="anomaly.id")


class DiagnosisCreate(DiagnosisBase):
    pass


class DiagnosisUpdate(DiagnosisBase):
    root_cause: str | None = Field(default=None, max_length=500)
    confidence: float | None = None
    anomaly_id: uuid.UUID | None = None


class Diagnosis(DiagnosisBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    anomaly: Anomaly = Relationship(back_populates="diagnoses")
    solutions: list["Solution"] = Relationship(
        back_populates="diagnosis", cascade_delete=True
    )


class SolutionBase(SQLModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=1000)
    roi_score: float = Field(default=0.0)
    diagnosis_id: uuid.UUID = Field(foreign_key="diagnosis.id")


class SolutionCreate(SolutionBase):
    pass


class SolutionUpdate(SolutionBase):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=1000)
    roi_score: float | None = None
    diagnosis_id: uuid.UUID | None = None


class Solution(SolutionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)

    diagnosis: Diagnosis = Relationship(back_populates="solutions")
