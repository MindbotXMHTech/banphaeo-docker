const { Client } = require("pg");
const express = require("express");
const cors = require("cors");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin:'*'
  }
});
const port = 8080;
const cron = require('node-cron');

const client = new Client({
  password: "root",
  user: "root",
  host: "postgres",
});

app.use(cors());
app.use(express.json())
app.use(express.static("public"));

// Cron jobs

// cron.schedule('* * * * *', () => {
//   console.log('Run task every minute');
// });

// Socket.io

io.on('connection', (socket) => {
  console.log("a user connected");
  socket.on('update', () => {
    io.emit('update');
  });
});

// REST_API For Website
  
// Insert

app.post("/web_register", async (req, res) => {

  const text = 'INSERT INTO users(name, surname, email, password, tel_number, role) VALUES($1, $2, $3, $4, $5, $6) RETURNING *'
  const values = [req.query.name, req.query.surname, req.query.email, req.query.password, req.query.tel_number, req.query.role]
  //console.log(values)
  client.query(text, values, (error, results) => {
    if(error){
      //console.log(error)
      res.status(400).send('Invalid Key')
    }
    else{
      res.status(201).send(`Add Register Complete`)
    }
  })
  
});

// Query

app.post("/web_login", async (req, res) => {
  try {
    const results = await client
      .query("SELECT * FROM users WHERE email=$1 AND password=$2", [req.body.email, req.body.password])
      .then((payload) => {
        return payload.rows;
      })

    if (results.length == 1) {
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify({
        "success": true,
        "profile": results[0]
      }));
    }
    else {
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify({
        "success": false
      }));
    }
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_users", async (req, res) => {
  try {
    const results = await client
      .query("SELECT * FROM users ")
      .then((payload) => {
        return payload.rows;
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_queue_cards", async (req, res) => {
  try {
    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, submit_date, login_id FROM prescription_records ORDER BY submit_date DESC LIMIT 150")
      .then((payload) => {
        return payload.rows
      });

    for (let i = 0; i < prescriptionRecords.length; i++) {
      let med_status = await client
        .query("SELECT medical_id, status FROM medicine_records WHERE prescript_id=$1", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })
      prescriptionRecords[i]["med_status"] = med_status
    }

    let cards = {
      "success": [],
      "error": [],
      "warning": []
    }

    for (const data of prescriptionRecords) {
      let cdata = data["med_status"].length
      let cnull = 0
      let cfalse = 0
      let ctrue = 0
      for (let o of data["med_status"]) {
        switch (o["status"]) {
          case null:
            cnull++;
            break;

          case true:
            ctrue++;
            break;

          case false:
            cfalse++;
            break;
        
          default:
            break;
        }
      }
      let cobj = {
        "pid": data["prescript_id"],
        "queueId": data["waiting_queue"],
        "prescriptId": data["prescript_no"],
        "numPart": ctrue,
        "numAll": cdata,
        "dt": data["submit_date"]
      };
      if (cdata !== cnull && cnull > 0) {
        cards["warning"].push(cobj);
        continue;
      }
      else if (cfalse > 0) {
        cards["error"].push(cobj);
        continue;
      }
      else if (ctrue === cdata) {
        cards["success"].push(cobj);
        continue;
      }
      else {
        console.log('else data :>> ', data);
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(cards));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_prescription_record/:id", async (req, res) => {
  try {
    let prescriptionRecords = await client
      .query("SELECT * FROM prescription_records WHERE prescript_id=$1", [req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return payload.rows[0]
        }
        else {
          res.status(200).send(null)
        }
      });

    let med_rec = await client
      .query("SELECT * FROM medicine_records WHERE prescript_id=$1 ORDER BY submit_date ASC", [prescriptionRecords.prescript_id])
      .then((payload) => {
        return payload.rows
      })

    prescriptionRecords['med_rec'] = []
    med_list = []
    cdata = med_rec.length
    cnull = 0
    cfalse = 0
    ctrue = 0
    for (let o of med_rec) {
      let foundind = med_list.findIndex(obj => obj.key === o['medical_id']);
      if (foundind === -1) {
        console.log("add new");
        med_list.push({
          key: o['medical_id'],
          med_name: o['med_name'],
          dose: o['dose'],
          status: o['status']
        })
      }
      else {
        console.log("exist");
        med_list[foundind] = {
          ...med_list[foundind],
          med_name: o['med_name'],
          dose: o['dose'],
          status: o['status']
        }
      }
      
      switch (o["status"]) {
        case null:
          cnull++;
          break;

        case true:
          ctrue++;
          break;

        case false:
          cfalse++;
          break;
      
        default:
          break;
      }

      console.log('med_list :>> ', med_list);
      if ((ctrue !== 0 || cfalse !== 0) && cnull > 0) {
        console.log("warning");
        prescriptionRecords['med_rec'].push({
          "submit_date": o['submit_date'],
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": med_list.sort((a,b) => a.key - b.key)
        })
      }
      else if (cfalse > 0) {
        console.log("error");
        prescriptionRecords['med_rec'].push({
          "submit_date": o['submit_date'],
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": med_list.sort((a,b) => a.key - b.key)
        })
      }
      else if (ctrue === cdata) {
        console.log("success");
        prescriptionRecords['med_rec'].push({
          "submit_date": o['submit_date'],
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": med_list.sort((a,b) => a.key - b.key)
        })
      }
    }
    console.log('prescriptionRecords :>> ', prescriptionRecords);

    prescriptionRecords['call'] = cdata
    prescriptionRecords['ctrue'] = ctrue
    prescriptionRecords['cerror'] = cfalse
    prescriptionRecords['cwarning'] = cnull

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(prescriptionRecords));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_prescription_stats", async (req, res) => {
  try {
    console.log('req.query.start_date :>> ', req.query.start_date);
    console.log('req.query.end_date :>> ', req.query.end_date);
    var start_date = req.query.start_date
    var end_date = req.query.end_date
  }
  catch (err) {
    console.error(err);
    res.status(400).send('Invalid Query Key')
  }
  try {
    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, patient_name, hospital_unit, submit_date, login_id FROM prescription_records WHERE $1<=submit_date AND submit_date<=$2", [start_date, end_date])
      .then((payload) => {
        return payload.rows
      });

    for (let i = 0; i < prescriptionRecords.length; i++) {
      let med_status = await client
        .query("SELECT medical_id, status FROM medicine_records WHERE prescript_id=$1", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })
      prescriptionRecords[i]["med_status"] = med_status
    }

    let table = []
    let hospital_unit = []

    function parse_status(stat) {
      switch (stat) {
        case "success":
          return "ถูกต้อง"

        case "warning":
          return "สูญหาย"

        case "error":
          return "ผิดพลาด"
      
        default:
          return null
      }
    }

    var cpdata = prescriptionRecords.length
    var cpnull = 0
    var cpfalse = 0
    var cptrue = 0
    for (const data of prescriptionRecords) {
      hospital_unit.push({
        "text":data["hospital_unit"],
        "value":data["hospital_unit"]
      })
      let cdata = data["med_status"].length
      let cnull = 0
      let cfalse = 0
      let ctrue = 0
      for (let o of data["med_status"]) {
        switch (o["status"]) {
          case null:
            cnull++;
            break;

          case true:
            ctrue++;
            break;

          case false:
            cfalse++;
            break;
        
          default:
            break;
        }
      }

      delete data.med_status
      if (cdata !== cnull && cnull > 0) {
        cpnull++;
        table.push({
          ...data,
          "status": parse_status("warning"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else if (cfalse > 0) {
        cpfalse++;
        table.push({
          ...data,
          "status": parse_status("error"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else if (ctrue === cdata) {
        cptrue++;
        table.push({
          ...data,
          "status": parse_status("success"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else {
        console.log('else data :>> ', data);
      }
    }

    var uniq = [...new Set(hospital_unit)];
    
    let summary = {
      success: cptrue*100/cpdata,
      warning: cpnull*100/cpdata,
      error: cpfalse*100/cpdata
    }

    console.log('summary :>> ', summary);
    console.log('summary.success :>> ', summary.success);
    if (isNaN(summary.success) || summary.success == null) {
      console.log('success nan')
      summary.success = 0
    }
    if (isNaN(summary.warning) || summary.warning == null) {
      summary.warning = 0
    }
    if (isNaN(summary.error) || summary.error == null) {
      summary.error = 0
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({
      "options": uniq,
      "chart": [
        {
          type: 'ถูกต้อง',
          value: cptrue,
        },
        {
          type: 'ผิดพลาด',
          value: cpfalse,
        },
        {
          type: 'สูญหาย',
          value: cpnull,
        }
      ],
      "summary": summary,
      "table": table
    }));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_user_rows", async (req, res) => {
  try {
    const results = await client
      .query("SELECT user_id AS id, concat(name, ' ', surname) AS name, CASE WHEN role='pharmacy' THEN 'เภสัชกร' WHEN role='staff' THEN 'เจ้าหน้าที่' ELSE NULL END AS type FROM users WHERE role <> 'admin'")
      .then((payload) => {
        return payload.rows;
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.get("/web_user/:id", async (req, res) => {
  try {
    const results = await client
      .query("SELECT user_id, name, surname, role, tel_number, email FROM users WHERE user_id=$1", [req.params.id])
      .then((payload) => {
        if (payload.rowCount < 1) {
          return null;
        }
        else{
          return JSON.stringify(payload.rows[0]);
        }
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(results);
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.delete("/web_user/:id", async (req, res) => {
  try {
    const results = await client
      .query("DELETE FROM users WHERE user_id=$1", [req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return {"success": true, "msg": `Removed ${payload.rowCount} data.`}
        }
        else {
          return {"success": false, "msg": "No data removed."}
        }
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.put("/web_user/:id/password", async (req, res) => {
  try {
    const results = await client
      .query("UPDATE users SET password=$1 WHERE user_id=$2", [req.query.data, req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return {"success": true, "msg": `Updated ${payload.rowCount} data.`}
        }
        else {
          return {"success": false, "msg": "No data updated."}
        }
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});

app.put("/web_user/:id/profile", async (req, res) => {
  try {
    const results = await client
      .query("UPDATE users SET name=$1, surname=$2, tel_number=$3, role=$4, email=$5 WHERE user_id=$6", [
        req.query.name, 
        req.query.surname,
        req.query.tel_number,
        req.query.role,
        req.query.email,
        req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return {"success": true, "msg": `Updated ${payload.rowCount} data.`}
        }
        else {
          return {"success": false, "msg": "No data updated."}
        }
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
});


// REST_API For Machine 

  // 1. Login
app.post("/hw_login", async (req, res) => {

    // Check Username
  const query = "SELECT * FROM users WHERE user_id = " + req.query.user_id
  client.query(query, (error, results) => {
    if (error) {
       res.status(400).send('Invalid Query Key')
    } 
    else {
      if (results['rows'].length == 0){
        // No user in database
        res.status(400).send('Not Found User')
      }
      else{
        // Found user then create login_records database
        const text = 'INSERT INTO login_records(machine_no, user_id) VALUES($1, $2) RETURNING *'
        const values = [req.query.machine_no, req.query.user_id]

        client.query(text, values, (error, results) => {
          if(error){
            //console.log(error)
            res.status(400).send('Invalid Insert login_records ')
          }
          else{
            var string = JSON.stringify(results);
            var objectValue = JSON.parse(string);

            //console.log(objectValue.rows[0].login_id)
            res.status(201).send("Login id : " + String(objectValue.rows[0].login_id))
          }
        })       
      }
    }
  })
});

  // 2. Prescription
app.post("/hw_prescript", async (req, res) => {

  // Insert prescription_records database

  const text_preds = 'INSERT INTO prescription_records (prescript_no, waiting_queue, patient_name, hn, age, hospital_unit, login_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *'
  const values_preds = [req.query.prescript_no, req.query.waiting_queue, req.query.patient_name, req.query.hn, req.query.age, req.query.hospital_unit, req.query.login_id]

  client.query(text_preds, values_preds, (error, results) => {
    if(error){
      // console.log(error)
      res.status(400).send('Invalid Prescription_record Key')
    }
    else{
      // Insert Medicine_records database
      var string = JSON.stringify(results);
      var objectValue = JSON.parse(string);
      
      // FK in medicine_records
      const prescript_id = objectValue.rows[0].prescript_id
      var insert_medicine_records = []

      const med_list = req.query.med_information.split(',');

      for(var i = 0; i < med_list.length; i++) {
        var med = med_list[i].split(':')[0]
        var dose = med_list[i].split(':')[1]
        var doctor = med_list[i].split(':')[2]        
        insert_medicine_records.push(new Array(med, dose, doctor, prescript_id))
      }

      var format = require('pg-format')

      client.query(format('INSERT INTO medicine_records (med_name, dose, doctor, prescript_id) VALUES %L', insert_medicine_records),[], (error, results)=>{
        if(error){
          console.log()
          res.status(400).send('Invalid data format in med_information Key')
        }
        else{
          io.emit('update');
          res.status(201).send("Prescript id : "+ prescript_id)
          console.log()
        }
      }); 
    }
  }) 
});

  // 3. Meidicine records
app.post("/hw_medicine", async (req, res) => {

  // Update status each medicine
  const text = "UPDATE medicine_records SET status = $1 WHERE prescript_id = $2 AND med_name = $3"
  const value = [req.query.result, req.query.prescript_id, req.query.med_name]
  
  client.query(text, value, (error, results) => {
    if (error) {
      res.status(400).send('Invalid Update Key')
    } 
    else {  
      io.emit('update');
      res.status(201).send("Update Medicine Complete")
    }
  })
});

// REST_API for debug (print all)

app.get("/all_users", async (req, res) => {
  const results = await client
    .query("SELECT * FROM users ")
    .then((payload) => {
      return payload.rows;
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    });
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(results));
});

app.get("/all_login_records", async (req, res) => {
  const results = await client
    .query("SELECT * FROM login_records ")
    .then((payload) => {
      return payload.rows;
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    });
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(results));
});

app.get("/all_prescription_records", async (req, res) => {
  const results = await client
    .query("SELECT * FROM prescription_records ")
    .then((payload) => {
      return payload.rows;
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    });
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(results));
});

app.get("/all_medicine_records", async (req, res) => {
  const results = await client
    .query("SELECT * FROM medicine_records ")
    .then((payload) => {
      return payload.rows;
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    });
  res.setHeader("Content-Type", "application/json");
  res.status(200);
  res.send(JSON.stringify(results));
});


(async () => {
  await client.connect();

  http.listen(port, () => {
    console.log(`App with Socket.io listening at http://localhost:${port}`);
  });
})();

const myPromise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("foo");
  }, 300);
  reject("oops");
});

myPromise.then(() => {
  console.log("hello");
});