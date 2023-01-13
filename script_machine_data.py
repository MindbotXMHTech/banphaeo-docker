import requests
import json
import time

# Website - Register website 
#url = "http://localhost:8080/web_register"
#data = {'surname': 'Joidee', 'email': 'test@hotmail.com', 'password': '1234', 'tel_number' : '0811111111', 'role': 'admin','name': 'Somchai'}
#r = requests.post(url, params = data)

#print(r.text)

#Machine - Login Machine
url = "http://localhost:8080/hw_login"
data = {'user_id' : '0', 'machine_no' : '1'}
r = requests.post(url, params = data)

print(r.text)

# Machine - Prescription_prescript
url = "http://localhost:8080/hw_prescript_demo"
data = {'prescript_no': '4B0065', 'waiting_queue' : '9681902', 'patient_name' : 'นาง มะลิ อยู่พิพัฒน์', 'hn': '067744-52', 'age': '18', 'login_id': '1', 'hospital_unit': 'ผู้ป่วยใน', 'med_information': 'Ambes:1:Dr.A,Mediplot:2:Dr.B'}
r = requests.post(url, params = data)

print(r.text)

# Machine - medicine_record
url = "http://localhost:8080/hw_medicine_demo"
data = {'prescript_id': '1', 'med_name' : 'Ambes', 'result' : 'True'}
#r = requests.post(url, params = data)
#
#print(r.text)

# Machine - medicine_record
url = "http://localhost:8080/hw_medicine_demo"
data = {'prescript_id': '1', 'med_name' : 'Mediplot', 'result' : 'True'}
#r = requests.post(url, params = data)
#
#print(r.text)

#time.sleep(10)
# Approve Again

# Machine - Prescription_prescript
#url = "http://localhost:8080/hw_prescript"
#data = {'prescript_no': '4B0063', 'waiting_queue' : '9681902', 'patient_name' : 'นาง มะลิ อยู่พิพัฒน์', 'hn': '067744-52', 'age': '18', 'login_id': '1', 'hospital_unit': 'ผู้ป่วยใน', 'med_information': 'Ambes:1:Dr.A,Mediplot:2:Dr.B'}
#r = requests.post(url, params = data)

#print(r.text)

# Machine - medicine_record
#url = "http://localhost:8080/hw_medicine"
#data = {'prescript_id': '2', 'med_name' : 'Ambes', 'result' : 'True'}
#r = requests.post(url, params = data)

#print(r.text)

# Machine - medicine_record
#url = "http://localhost:8080/hw_medicine"
#data = {'prescript_id': '2', 'med_name' : 'Mediplot', 'result' : 'True'}
#r = requests.post(url, params = data)

#print(r.text)









