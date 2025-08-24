import pydantic
import os
import tempfile
import json
from datetime import datetime, timedelta


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


def is_product_in_inventory(product_name: str):
    inventory = load_json(PRODUCTS_DATA_PATH, "product")
    for product_inventory in inventory:
        if product_name.lower() == product_inventory.name.lower():
            return True
    return False

def get_quantity_without_unit(quantity: str | int):
    quantity_without_unit = ""
    index = 0
    if isinstance(quantity, int) or quantity == "":
        return quantity
    
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
            if shopping_product.name == shopping_product_list.name and shopping_product.date == shopping_product_list.date:

                shopping_product_list.quantity = str(get_quantity_without_unit(shopping_product_list.quantity) + get_quantity_without_unit(shopping_product.quantity)) + get_quantity_unit(shopping_product.quantity)

                shopping_product_list.actual_quantity = str(get_quantity_without_unit(shopping_product_list.actual_quantity) + get_quantity_without_unit(shopping_product.actual_quantity)) + get_quantity_unit(shopping_product.actual_quantity)
                found = True
                
                break
        if not found:
            shopping_product_list = Shopping_Product(name=shopping_product.name, quantity=shopping_product.quantity, actual_quantity=shopping_product.actual_quantity, date=shopping_product.date, checked=shopping_product.checked)
            shopping_list.append(shopping_product_list)
            
    return shopping_list

print(load_json(COURSES_LIST_DATA_PATH, "shopping_product"))
print("----------------")
print(merge_shopping())
