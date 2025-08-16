from datetime import datetime, timedelta
import json
import pydantic

class Flow(pydantic.BaseModel):
    category: str
    amount: float
    date: str

def load_flux():
    with open("backend/flux.json", "r") as f:
        data = json.load(f)
        data = [Flow(**flow) for flow in data]
    return data

def sort_flows(data):
    return sorted(
        data,
        key=lambda x: datetime.strptime(x.date, "%d/%m/%Y"),
        reverse=True
    )

def get_last_week_flows(depenses_triees):
    last_week_flows = []
    today = datetime.now()
    last_week = today - timedelta(days=7)

    for flow in depenses_triees:
        if last_week <= datetime.strptime(flow.date, "%d/%m/%Y") <= today:
            last_week_flows.append(flow)

    return last_week_flows

depenses_triees = sort_flows(load_flux())
print(get_last_week_flows(depenses_triees))

