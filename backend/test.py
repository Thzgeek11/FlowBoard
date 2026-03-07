import json
import uuid
import hashlib

LOGINS_DATA_PATH = "backend/logins.json"


tokens = {}
logins = json.load(open(LOGINS_DATA_PATH, "r"))
print(logins)


usernames_list = [login["username"] for login in logins]

if "thzgeek" in usernames_list:
    print("thzgeek est dans la liste")



