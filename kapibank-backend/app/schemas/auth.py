from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator, field_validator

class LoginRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72: raise ValueError("Пароль должен занимать не более 72 байт UTF-8")
        return value

class RegisterRequest(LoginRequest):
    fullName: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    @model_validator(mode='after')
    def clean_name(self):
        self.fullName = self.fullName.strip()
        if not self.fullName: raise ValueError('Укажите имя')
        return self

class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    company: str = Field(min_length=1, max_length=150)
    legalForm: str
    industry: str
    industryDescription: str = Field(default='', max_length=200)
    businessAgeMonths: str
    @model_validator(mode='after')
    def validate_fields(self):
        from app.schemas.recommendation import QuestionnaireAnswers
        QuestionnaireAnswers(industry=self.industry, industryDescription=self.industryDescription, legalForm=self.legalForm, businessAgeMonths=int(self.businessAgeMonths) if self.businessAgeMonths.strip().isdigit() else -1, purpose='working_capital', principal='1.00', termMonths=1)
        if not self.name.strip() or not self.company.strip(): raise ValueError('Имя и компания не должны быть пустыми')
        return self

class TokenResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    accessToken: str
    tokenType: str = 'bearer'
    role: str
    fullName: str
    email: str
    boundInn: str | None

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(extra='forbid')
    id: str
    email: str
    fullName: str
    role: str
    boundInn: str | None
    profile: dict = Field(default_factory=dict)
