from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi import Header, HTTPException
from datetime import datetime, timedelta
from graph import create_graph # TODO: rajouter un point de graph pour la version déployer
from typing import List, Dict
import tempfile
import pydantic
from pydantic import BaseModel
import uuid
import uvicorn
import hashlib
import fastapi
import shutil
import time
import json
import os
import io


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


class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    token: str

FLUX_DATA_PATH = "backend/flux.json"
PRODUCTS_DATA_PATH = "backend/inventory.json"
RECIPES_DATA_PATH = "backend/recipe.json"
COURSES_LIST_DATA_PATH = "backend/courses_list.json"

LOGINS_DATA_PATH = "backend/logins.json"



# FLOWBOARD AUTHSYS

tokens = {}
logins = {login["username"]: login["password"] for login in json.load(open(LOGINS_DATA_PATH, "r"))}
usernames_list = list(logins.keys())

def md5(string):
    hash_md5 = hashlib.md5()
    hash_md5.update(string.encode('utf-8'))
    return hash_md5.hexdigest()

def generate_token() -> str:
    return str(uuid.uuid4())

def verify(token):
    return True if token in tokens.values() else False

@app.post("/api/check_access")
def check_access(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"status": "success", "message": "Access granted"}

@app.post("/api/login")
def login(data: LoginRequest):
    
    if data.username.lower() not in usernames_list:
        return {"status": "error", "message": "Invalid credentials"}
    
    if md5(data.password) != logins[data.username.lower()]:
        return {"status": "error", "message": "Invalid credentials"}
    
    token = generate_token()
    tokens[data.username] = token
    return {"status": "success", "message": "Login successful", "token": token}



# FLOWBOARD BACKEND

def safe_write_json(path: str, data: List[Dict]):
    """
    Écrit un JSON de manière atomique (évite fichiers vides si crash).
    Compatible Linux et Windows même si tmp file est sur un autre device.
    """
    # On place le tmp file dans le même dossier que le fichier final
    dir_ = os.path.dirname(os.path.abspath(path))
    with tempfile.NamedTemporaryFile(mode='w', delete=False, encoding='utf-8', dir=dir_) as tmp_file:
        json.dump(data, tmp_file, indent=2, ensure_ascii=False)
        tmp_path = tmp_file.name

    # On remplace le fichier final de façon sécurisée
    try:
        os.replace(tmp_path, path)  # atomic si même device
    except OSError:
        # fallback si cross-device (Linux)
        shutil.move(tmp_path, path)

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


def is_product_in_inventory(product_name: str):
    inventory = load_json(PRODUCTS_DATA_PATH, "product")
    for product_inventory in inventory:
        if product_name.lower() == product_inventory.name.lower():
            return True
    return False

def get_quantity_without_unit(quantity: str | int):
    quantity_without_unit = ""
    index = 0
    if isinstance(quantity, int):
        return quantity

    if quantity == "":
        return 0
    
    while quantity[index].isnumeric():
        quantity_without_unit += quantity[index]
        if index == len(quantity) - 1:
            break
        index += 1
    return int(quantity_without_unit)

def get_quantity_unit(quantity: str | int):
    quantity_unit = ""
    index = 0
    if isinstance(quantity, int) or quantity == "":
        return ""
    
    while index < len(quantity):
        if quantity[index].isalpha():
            quantity_unit += quantity[index:]
            break
        index += 1
    return quantity_unit

def have_enough_product(product_name: str, quantity: str):
    inventory = load_json(PRODUCTS_DATA_PATH, "product")

    if not is_product_in_inventory(product_name):
        return False

    total_of_product = 0
    for product_inventory in inventory:
        if product_name.lower() != product_inventory.name.lower():
            continue
            
        total_of_product += get_quantity_without_unit(product_inventory.quantity)

        if total_of_product >= get_quantity_without_unit(quantity):
            return True
    return False


def merge_shopping():
    """ Fusionne les produits de la liste de courses avec la même date et le même nom """
    shopping = load_json(COURSES_LIST_DATA_PATH, "shopping_product")
    shopping_list = []
    for shopping_product in shopping:
        found = False
        for shopping_product_list in shopping_list:
            if shopping_product.name.lower() == shopping_product_list.name.lower() and shopping_product.date == shopping_product_list.date:

                shopping_product_list.quantity = str(get_quantity_without_unit(shopping_product_list.quantity) + get_quantity_without_unit(shopping_product.quantity)) + get_quantity_unit(shopping_product.quantity)

                shopping_product_list.actual_quantity = str(get_quantity_without_unit(shopping_product_list.actual_quantity) + get_quantity_without_unit(shopping_product.actual_quantity)) + get_quantity_unit(shopping_product.actual_quantity)
                found = True
                
                break
        if not found:
            shopping_product_list = Shopping_Product(name=shopping_product.name, quantity=shopping_product.quantity, actual_quantity=shopping_product.actual_quantity, date=shopping_product.date, checked=shopping_product.checked)
            shopping_list.append(shopping_product_list)
            
    return shopping_list

def get_all_months():
    flux = load_json(FLUX_DATA_PATH, "flow")

    months = {
        (year := datetime.strptime(i.date, "%d/%m/%Y").year,
         month := datetime.strptime(i.date, "%d/%m/%Y").month,
         get_monthly_data(month, year))
        for i in flux
    }
    
    return sorted(list(months), reverse=True)

def get_monthly_data(month, year):
    flux = load_json(FLUX_DATA_PATH, "flow")
    somme = 0
    for i in flux:
        date = datetime.strptime(i.date, '%d/%m/%Y')
        if date.month == month and date.year == year:
            somme += i.amount
    return somme

# FINANCES

@app.get("/finances/get_history/{number}")
def get_history(number: int = 10, x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    flux = load_json(FLUX_DATA_PATH, "flow")
    return flux[::-1][:number]

@app.get("/finances/get_graph")
def get_graph(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    flux = sort_flows(load_json(FLUX_DATA_PATH, "flow"))
    list_inflow, list_outflow = get_inoutlist(get_last_week_flows(flux))
    buf = create_graph(list_outflow, list_inflow)  # renvoie un BytesIO
    return StreamingResponse(buf, media_type="image/png")

@app.post("/finances/add_flow")
def add_flow(flow: Flow, x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    flux = load_json(FLUX_DATA_PATH, "flow")
    flux.append(flow)
    save_json(FLUX_DATA_PATH, flux)
    return {"status": "success", "message": "Flux ajouté avec succès"}

@app.get("/finances/get_months")
def get_months(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    return get_all_months()

# INVENTORY

@app.get("/inventory/get_products")
def get_products(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    products = load_json(PRODUCTS_DATA_PATH, "product")
    return products

@app.post("/inventory/save_products")
def save_product(products: list[Product], x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    save_json(PRODUCTS_DATA_PATH, products)
    return {"status": "success", "message": "Produits sauvegardés avec succès"}    

@app.get("/inventory/get_recipes")
def get_recipes(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    recipes = load_json(RECIPES_DATA_PATH, "recipe")
    return recipes

@app.post("/inventory/save_recipes")
def save_recipes(recipes: list[Recipe], x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    save_json(RECIPES_DATA_PATH, recipes)
    return {"status": "success", "message": "Recettes sauvegardées avec succès"}

# Recette

@app.get("/inventory/have_enough_product/{product_name}/{quantity}")
def get_recipes(product_name: str, quantity: str, x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    time.sleep(0.15) # pour éviter les erreurs coté frontend
    return have_enough_product(product_name, quantity)

#add_recipe_itemp_course_list
@app.post("/inventory/add_to_course_list")
def add_to_course_list(shopping_product: Shopping_Product, x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    shopping = load_json(COURSES_LIST_DATA_PATH, "shopping_product")
    shopping.append(shopping_product)
    save_json(COURSES_LIST_DATA_PATH, shopping)
    return {"status": "success", "message": "Produit ajouté avec succès dans la liste de courses"}


# SHOPPING

@app.post("/shopping/save_shopping")
def save_shopping(shopping: list[Shopping_Product], x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    save_json(COURSES_LIST_DATA_PATH, shopping)
    return {"status": "success", "message": "Courses sauvegardées avec succès"}

@app.get("/shopping/get_shopping")
def get_shopping(x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    shopping = load_json(COURSES_LIST_DATA_PATH, "shopping_product")
    shopping = merge_shopping()
    return shopping

@app.post("/shopping/add_shopping_item_to_inventory")
def add_shopping_item_to_inventory(shopping_product: Shopping_Product, x_api_key: str = Header(None)):
    if not verify(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid token")
        
    inventory = load_json(PRODUCTS_DATA_PATH, "product")
    inventory.append(Product(name=shopping_product.name, quantity=shopping_product.actual_quantity, date=shopping_product.date))
    save_json(PRODUCTS_DATA_PATH, inventory)
    return {"status": "success", "message": "Courses ajoutées avec succès dans l'inventaire"}












if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5600)