from datetime import datetime, timedelta
import pydantic

class Flow(pydantic.BaseModel):
    category: str
    amount: float
    date: str

flux_data = [
    Flow(category="Test", amount=10.0, date="16/08/2025"),
    Flow(category="Test", amount=10.0, date="15/08/2025"),
    Flow(category="Test", amount=-10.0, date="14/08/2025"),
    Flow(category="Test", amount=10.0, date="13/08/2025"),
    Flow(category="Test", amount=10.0, date="12/08/2025"),
    Flow(category="Test", amount=10.0, date="11/08/2025"),
    Flow(category="Test", amount=10.0, date="10/08/2025"),
    Flow(category="Test", amount=10.0, date="09/08/2025"),
    Flow(category="Test", amount=10.0, date="08/08/2025"),
]

j_6 = datetime.now() - timedelta(days=6)
j_5 = datetime.now() - timedelta(days=5)
j_4 = datetime.now() - timedelta(days=4)
j_3 = datetime.now() - timedelta(days=3)
j_2 = datetime.now() - timedelta(days=2)
j_1 = datetime.now() - timedelta(days=1)
j_0 = datetime.now()

print(j_6)
print(j_5)
print(j_4)
print(j_3)
print(j_2)
print(j_1)
print(j_0)

print(int(-(datetime.now() - datetime.strptime(flux_data[0].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[1].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[2].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[3].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[4].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[5].date, "%d/%m/%Y")).days)-1)
print(int(-(datetime.now() - datetime.strptime(flux_data[6].date, "%d/%m/%Y")).days)-1)

print(flux_data[0].date)
print(datetime.strptime(flux_data[0].date, "%d/%m/%Y"))