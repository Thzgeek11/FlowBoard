import fastapi
import uvicorn
import pydantic
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from graph import create_graph
import io
import json

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

@app.get("/finances/get_history")
def get_history():
    return data[::-1][0:10]

@app.get("/finances/get_graph")
def get_graph():
    buf = create_graph()  # renvoie un BytesIO
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
