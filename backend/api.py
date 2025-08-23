import fastapi
import uvicorn
import pydantic
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from graph import create_graph
import io
import json
import os
import tempfile
from datetime import datetime, timedelta

app = fastapi.FastAPI()

# Autoriser ton frontend (ou tous)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ton site
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Flow(pydantic.BaseModel):
    category: str
    amount: float
    date: str

class Product(pydantic.BaseModel):
    name: str
    quantity: str
    date: str


class Ingredient(pydantic.BaseModel):
    name: str
    quantity: str

class Recipe(pydantic.BaseModel):
    name: str
    quantity: str
    temps: str
    ingredients: list[Ingredient]

class Shopping_Product(pydantic.BaseModel):
    name: str
    quantity: str
    actual_quantity: str
    date: str
    checked: bool

FLUX_DATA_PATH = "backend/flux.json"
PRODUCTS_DATA_PATH = "backend/inventory.json"
RECIPES_DATA_PATH = "backend/recipe.json"
COURSES_LIST_DATA_PATH = "backend/courses_list.json"

def safe_write_json(path: str, data: list[dict]):
    """Écrit un JSON de manière atomique (évite fichiers vides si crash)."""
    tmp_fd, tmp_path = tempfile.mkstemp()
    with os.fdopen(tmp_fd, "w", encoding="utf-8") as tmp_file:
        json.dump(data, tmp_file, indent=2, ensure_ascii=False)
    os.replace(tmp_path, path)

def load_json(path: str, type: str) -> list[Flow] | list[Product] | list[Recipe] | list[Shopping_Product]:
    """Charge le fichier JSON en Flow[], tolère vide/corrompu."""
    if not os.path.exists(path):
        safe_write_json(path, [])
        return []

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if type == "flow":
                return [Flow(**flow) for flow in data]
            elif type == "product":
                return [Product(**product) for product in data]
            elif type == "recipe":
                return [Recipe(**recipe) for recipe in data]
            elif type == "shopping_product":
                return [Shopping_Product(**shopping_product) for shopping_product in data]
    except (json.JSONDecodeError, FileNotFoundError):
        # fichier vide/corrompu → reset
        safe_write_json(path, [])
        return []

def pydantic_to_dict(data: list[Flow] | list[Product] | list[Recipe] | list[Shopping_Product]):
    return [flow.model_dump() for flow in data]

def save_json(path: str, data_pydantic: list[Flow] | list[Product] | list[Recipe] | list[Shopping_Product]):
    """Sauvegarde la liste de Flow en JSON dict."""
    dicts = pydantic_to_dict(data_pydantic)
    safe_write_json(path, dicts)

def sort_flows(flux_data: list[Flow]):
    return sorted(
        flux_data,
        key=lambda x: datetime.strptime(x.date, "%d/%m/%Y"),
        reverse=True,
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
        days_ago = (datetime.now() - datetime.strptime(flow.date, "%d/%m/%Y")).days
        if 0 <= days_ago < 7:
            list_inflow[6 - days_ago] += flow.amount
    for flow in outflow:
        days_ago = (datetime.now() - datetime.strptime(flow.date, "%d/%m/%Y")).days
        if 0 <= days_ago < 7:
            list_outflow[6 - days_ago] += flow.amount

    return list_inflow, list_outflow


# FINANCES

@app.get("/finances/get_history/{number}")
def get_history(number: int = 10):
    flux = load_json(FLUX_DATA_PATH, "flow")
    return flux[::-1][:number]

@app.get("/finances/get_graph")
def get_graph():
    flux = sort_flows(load_json(FLUX_DATA_PATH, "flow"))
    list_inflow, list_outflow = get_inoutlist(get_last_week_flows(flux))
    buf = create_graph(list_outflow, list_inflow)  # renvoie un BytesIO
    return StreamingResponse(buf, media_type="image/png")

@app.post("/finances/add_flow")
def add_flow(flow: Flow):
    flux = load_json(FLUX_DATA_PATH, "flow")
    flux.append(flow)
    save_json(FLUX_DATA_PATH, flux)
    return {"status": "success", "message": "Flux ajouté avec succès"}


# INVENTORY

@app.get("/inventory/get_products")
def get_products():
    products = load_json(PRODUCTS_DATA_PATH, "product")
    return products

@app.post("/inventory/save_products")
def save_product(products: list[Product]):
    print(products)
    save_json(PRODUCTS_DATA_PATH, products)
    return {"status": "success", "message": "Produits sauvegardés avec succès"}    

@app.get("/inventory/get_recipes")
def get_recipes():
    recipes = load_json(RECIPES_DATA_PATH, "recipe")
    return recipes

@app.post("/inventory/save_recipes")
def save_recipes(recipes: list[Recipe]):
    save_json(RECIPES_DATA_PATH, recipes)
    return {"status": "success", "message": "Recettes sauvegardées avec succès"}


# SHOPPING

@app.post("/shopping/save_shopping")
def save_shopping(shopping: list[Shopping_Product]):
    save_json(COURSES_LIST_DATA_PATH, shopping)
    return {"status": "success", "message": "Courses sauvegardées avec succès"}

@app.get("/shopping/get_shopping")
def get_shopping():
    shopping = load_json(COURSES_LIST_DATA_PATH, "shopping_product")
    return shopping

@app.post("/shopping/add_shopping_item_to_inventory")
def add_shopping_item_to_inventory(shopping_product: Shopping_Product):
    inventory = load_json(PRODUCTS_DATA_PATH, "product")
    inventory.append(Product(name=shopping_product.name, quantity=shopping_product.actual_quantity, date=shopping_product.date))
    save_json(PRODUCTS_DATA_PATH, inventory)
    return {"status": "success", "message": "Courses ajoutées avec succès dans l'inventaire"}












if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5600)