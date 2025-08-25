from dotenv import load_dotenv
import os
from supabase import create_client, Client
import pydantic

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


class Supabase:
    def __init__(self):
        # Charger les variables d'environnement
        load_dotenv()

        # Initialiser le client Supabase
        self.url: str = os.getenv("SUPABASE_URL")
        self.key: str = os.getenv("SUPABASE_KEY")

        self.supabase: Client = create_client(self.url, self.key)
 
    def get_data(self):
        response = self.supabase.table("Data JSON").select("*").execute()
        return response.data

    def update_data(self, updated_data):
        response = (
            self.supabase.table("Data JSON")     
                .update(updated_data)    
                    .eq("id", 1)              
                    .execute()
            )
        return response.data

    def get_flux(self):
        response = self.supabase.table("Data JSON").select("flux").execute()
        return response.data[0]["flux"]

    def save_flux(self, updated_data):
        updated_data = [item.model_dump() if type(item) != dict else item for item in updated_data]
        response = (
            self.supabase.table("Data JSON")     
                .update({"flux": updated_data})     
                    .eq("id", 1)
                    .execute()
            )
        return response.data

    def get_inventory(self):
        response = self.supabase.table("Data JSON").select("inventory").execute()
        return response.data[0]["inventory"]

    def save_inventory(self, updated_data):
        updated_data = [item.model_dump() if type(item) != dict else item for item in updated_data]
        response = (
            self.supabase.table("Data JSON")     
                .update({"inventory": updated_data})     
                    .eq("id", 1)
                    .execute()
            )
        return response.data


    def get_recipe(self):
        response = self.supabase.table("Data JSON").select("recipe").execute()
        return response.data[0]["recipe"]

    def save_recipe(self, updated_data):
        updated_data = [item.model_dump() if type(item) != dict else item for item in updated_data]
        response = (
            self.supabase.table("Data JSON")     
                .update({"recipe": updated_data})     
                    .eq("id", 1)
                    .execute()
            )
        return response.data

    
    def get_courses_list(self):
        response = self.supabase.table("Data JSON").select("courses_list").execute()
        return response.data[0]["courses_list"]

    def save_courses_list(self, updated_data):
        updated_data = [item.model_dump() if type(item) != dict else item for item in updated_data]
        response = (
            self.supabase.table("Data JSON")     
                .update({"courses_list": updated_data})     
                    .eq("id", 1)
                    .execute()
            )
        return response.data