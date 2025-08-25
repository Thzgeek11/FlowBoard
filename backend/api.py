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
import time
import subabase_api

app = fastapi.FastAPI()

supabase = subabase_api.Supabase()

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


def sort_flows(flux_data: list[Flow]):
    flux_data = [Flow(**item) for item in flux_data if type(item) == dict]
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
    inventory = supabase.get_inventory()
    for product_inventory in inventory:
        if product_name.lower() == product_inventory["name"].lower():
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
    inventory = supabase.get_inventory()

    if not is_product_in_inventory(product_name):
        return False

    total_of_product = 0
    for product_inventory in inventory:
        if product_name.lower() != product_inventory["name"].lower():
            continue
            
        total_of_product += get_quantity_without_unit(product_inventory["quantity"])

        if total_of_product >= get_quantity_without_unit(quantity):
            return True
    return False


def merge_shopping():
    """ Fusionne les produits de la liste de courses avec la même date et le même nom """
    shopping = supabase.get_courses_list()
    shopping = [Shopping_Product(**item) for item in shopping if type(item) == dict]
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


# FINANCES

@app.get("/finances/get_history/{number}")
def get_history(number: int = 10):
    flux = supabase.get_flux()
    return flux[::-1][:number]

@app.get("/finances/get_graph")
def get_graph():
    flux = sort_flows(supabase.get_flux())
    list_inflow, list_outflow = get_inoutlist(get_last_week_flows(flux))
    buf = create_graph(list_outflow, list_inflow)  # renvoie un BytesIO
    return StreamingResponse(buf, media_type="image/png")


@app.post("/finances/add_flow")
def add_flow(flow: Flow):
    flux = supabase.get_flux()
    flux.append(flow)
    supabase.save_flux(flux)
    return {"status": "success", "message": "Flux ajouté avec succès"}


# INVENTORY

@app.get("/inventory/get_products")
def get_products():
    products = supabase.get_inventory()
    return products

@app.post("/inventory/save_products")
def save_product(products: list[Product]):
    supabase.save_inventory(products)
    return {"status": "success", "message": "Produits sauvegardés avec succès"}    

@app.get("/inventory/get_recipes")
def get_recipes():
    recipes = supabase.get_recipe()
    return recipes

@app.post("/inventory/save_recipes")
def save_recipes(recipes: list[Recipe]):
    supabase.save_recipe(recipes)
    return {"status": "success", "message": "Recettes sauvegardées avec succès"}

# Recette

@app.get("/inventory/have_enough_product/{product_name}/{quantity}")
def get_recipes(product_name: str, quantity: str):
    time.sleep(0.15) # pour éviter les erreurs coté frontend
    return have_enough_product(product_name, quantity)

#add_recipe_itemp_course_list
@app.post("/inventory/add_to_course_list")
def add_to_course_list(shopping_product: Shopping_Product):
    shopping = supabase.get_courses_list()
    shopping.append(shopping_product)
    supabase.save_courses_list(shopping)
    return {"status": "success", "message": "Produit ajouté avec succès dans la liste de courses"}


# SHOPPING

@app.post("/shopping/save_shopping")
def save_shopping(shopping: list[Shopping_Product]):
    supabase.save_courses_list(shopping)
    return {"status": "success", "message": "Courses sauvegardées avec succès"}

@app.get("/shopping/get_shopping")
def get_shopping():
    shopping = supabase.get_courses_list()
    shopping = merge_shopping()
    return shopping

@app.post("/shopping/add_shopping_item_to_inventory")
def add_shopping_item_to_inventory(shopping_product: Shopping_Product):
    inventory = supabase.get_inventory()
    inventory.append(Product(name=shopping_product.name, quantity=shopping_product.actual_quantity, date=shopping_product.date))
    supabase.save_inventory(inventory)
    return {"status": "success", "message": "Courses ajoutées avec succès dans l'inventaire"}












if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5600)