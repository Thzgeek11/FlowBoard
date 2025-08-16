import fastapi
import uvicorn
import pydantic
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from graph import create_graph
import io
import json
from datetime import *

app = fastapi.FastAPI()

# Autoriser ton frontend (ou tous)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ton site
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc.
    allow_headers=["*"],
)

class Flow(pydantic.BaseModel):
    category: str
    amount: float
    date: str

try:
    with open("backend/flux.json", "r") as f:
        data = json.load(f)
        data = [Flow(**flow) for flow in data]
except FileNotFoundError:
    data = []
    with open("backend/flux.json", "w") as f:
        json.dump(data, f)





def load_flux():
    with open("backend/flux.json", "r") as f:
        data = json.load(f)
        data = [Flow(**flow) for flow in data]
    return data

def sort_flows(flux_data: list[Flow]):
    return sorted(
        flux_data,
        key=lambda x: datetime.strptime(x.date, "%d/%m/%Y"),
        reverse=True
    )

def get_last_week_flows(flux_data: list[Flow]):
    last_week_flows = []
    today = datetime.now()
    last_week = today - timedelta(days=7)

    for flow in flux_data:
        if last_week <= datetime.strptime(flow.date, "%d/%m/%Y") <= today:
            last_week_flows.append(flow)

    return last_week_flows

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
        list_inflow[int(-(datetime.now() - datetime.strptime(flow.date, "%d/%m/%Y")).days)-1] += flow.amount
    for flow in outflow:
        list_outflow[int(-(datetime.now() - datetime.strptime(flow.date, "%d/%m/%Y")).days)-1] += flow.amount

    return list_inflow, list_outflow





@app.get("/finances/get_history/{number}")
def get_history(number: int = 10):
    return data[::-1][0:number]

@app.get("/finances/get_graph")
def get_graph():
    list_inflow, list_outflow = get_inoutlist(get_last_week_flows(sort_flows(load_flux())))
    buf = create_graph(list_outflow, list_inflow)  # renvoie un BytesIO
    return StreamingResponse(buf, media_type="image/png")

@app.post("/finances/add_flow")
def add_flow(flow: Flow):
    data.append(flow.model_dump())
    with open("backend/flux.json", "w") as f:
        json.dump(data, f)
    return "add_flow"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5600)
