import requests
import json
import time

#Machine - Login Machine
url = "http://localhost:8080/hw_login"
data = {'user_id' : '0', 'machine_no': 'd0:88:0c:61:62:55'}
r = requests.post(url, json = data)
receive = json.loads(r.text)
login_id = (receive['login_id'])
print(r.content)
time.sleep(3)

# Round 1

# Machine - Prescription_prescript
url = "http://localhost:8080/hw_prescript"
data = {'login_id': login_id, "prescript_no": "1B0030-20330331"}
r = requests.post(url, json = data)
receive = json.loads(r.text)
prescript_id = (receive['prescript_id'])
print(r.content)
time.sleep(3)

# Machine - Update medicine in prescript
url = "http://localhost:8080/hw_status"
data = {'med_name': "Enalapril tab 20 mg.-L", "pred_cls": "Enalapril tab 20 mg.-L", "prescript_id" : prescript_id, "photo" : ""}
r = requests.post(url, json = data)
print(r.content)
time.sleep(3)

# Machine - Complete prescript
url = "http://localhost:8080/hw_end"
data = { "prescript_id" : prescript_id}
r = requests.post(url, json = data)
print(r.content)


