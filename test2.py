from datetime import datetime, timedelta
import pydantic

class Flow(pydantic.BaseModel):
    category: str
    amount: float
    date: str

flux_data = [
    Flow(category="Test", amount=10.0, date="16/08/2025"),
    Flow(category="Test", amount=10.0, date="16/08/2025"),
    Flow(category="Test", amount=-10.0, date="16/08/2025"),
    Flow(category="Test", amount=10.0, date="15/08/2025"),
    Flow(category="Test", amount=10.0, date="14/08/2025"),
    Flow(category="Test", amount=10.0, date="13/08/2025"),
    Flow(category="Test", amount=10.0, date="12/08/2025"),
    Flow(category="Test", amount=10.0, date="11/08/2025"),
    Flow(category="Test", amount=10.0, date="10/08/2025"),
]

def get_inoutlist(flux_data: list[Flow]):
    inflow = []
    outflow = []
    for flow in flux_data:
        if flow.amount > 0:
            inflow.append(flow)
        else:
            outflow.append(flow)
    
    list_inflow = [0 for _ in range(7)]
    list_outflow = [0 for _ in range(7)]
    
    for flow in inflow:
        list_inflow[datetime.strptime(flow.date, "%d/%m/%Y").weekday()] += flow.amount
    for flow in outflow:
        list_outflow[datetime.strptime(flow.date, "%d/%m/%Y").weekday()] += flow.amount
    
    print(list_inflow)
    print(list_outflow)
    return list_inflow, list_outflow

get_inoutlist(flux_data)
