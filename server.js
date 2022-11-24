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
const moment = require("moment")

const client = new Client({
  password: "root",
  user: "root",
  host: "postgres",
});


// Functions
function reformat_date(mydt) {
  // dd/MM/yyyy hh:mm:ss
  return `${mydt.getDate()}/${(mydt.getMonth()<9?'0':'')+(mydt.getMonth()+1)}/${mydt.getFullYear()} ${(mydt.getHours()<10?'0':'')+mydt.getHours()}:${(mydt.getMinutes()<10?'0':'')+mydt.getMinutes()}:${(mydt.getSeconds()<10?'0':'')+mydt.getSeconds()}`
}


app.use(cors());
app.use(express.json())
app.use(express.static("public"));

// Cron jobs

cron.schedule('* * * * *', () => {
  console.log('Run task every minute');
  io.emit('update');
});

// Socket.io

io.on('connection', (socket) => {
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

app.get("/web_validate_email", async (req,res) => {
  try {
    format = String(req.query.email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
    
    if (!format) {
      res.status(422).send("Invalid data format.")
    }

    const results = await client
      .query("SELECT count(1) FROM users WHERE email=$1", [req.query.email])
      .then((payload) => {
        console.log('count :>> ', payload);
        return payload;
      })
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(results.rows[0]["count"]));
  }
  catch (err) {
    console.error(err);
    res.status(500).send("Internal server error.");
    throw new Error("Query failed");
  }
})

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
    let cards = {
      "success": [],
      "error": [],
      "warning": []
    }

    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, submit_date AT TIME ZONE 'ALMST' AS submit_date, login_id FROM prescription_records ORDER BY submit_date DESC LIMIT 150")
      .then((payload) => {
        return payload.rows
      });

    let i = prescriptionRecords.length
    while (i--) {
      let med_status = await client
        .query("SELECT medical_id, status, submit_date AT TIME ZONE 'ALMST' FROM medicine_records WHERE prescript_id=$1", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })
      
      let cdata = med_status.length
      let tnow = moment().add(7,"h")
      let trec = moment(prescriptionRecords[i]["submit_date"])
      let tdiff = moment.duration(tnow.diff(trec)).asMinutes()
      console.log('tnow, trec, tdiff :>> ', tnow, trec, tdiff);

      // check first med record which is added less than 15 mins
      if (cdata === 1 && med_status[0]["status"] === null && tdiff < 15) {
        prescriptionRecords.splice(i, 1)
        continue
      }

      // add all med record to a related prescription record
      prescriptionRecords[i]["med_status"] = med_status

      let cnull = 0
      let cfalse = 0
      let ctrue = 0

      for (let o of prescriptionRecords[i]["med_status"]) {
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
        "pid": prescriptionRecords[i]["prescript_id"],
        "queueId": prescriptionRecords[i]["waiting_queue"],
        "prescriptId": prescriptionRecords[i]["prescript_no"],
        "numPart": ctrue,
        "numAll": cdata,
        "dt": reformat_date(prescriptionRecords[i]["submit_date"])
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
      else if (tdiff > 15) {
        cards["warning"].push(cobj);
        continue;
      }
      else {
        console.log(`Prescription ID ${prescriptionRecords[i]["prescript_id"]} is ignored. cdata=${cdata} cnull=${cnull} tdiff=${tdiff}`);
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
      .query("SELECT *, submit_date AT TIME ZONE 'ALMST' AS submit_date FROM prescription_records WHERE prescript_id=$1", [req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return payload.rows[0]
        }
        else {
          res.status(200).send(null)
        }
      });
    prescriptionRecords['submit_date'] = reformat_date(prescriptionRecords['submit_date'])

    let med_rec = await client
      .query("SELECT * FROM medicine_records WHERE prescript_id=$1 ORDER BY medical_id ASC", [prescriptionRecords.prescript_id])
      .then((payload) => {
        return payload.rows
      })

    prescriptionRecords['med_rec'] = []
    let med_list = []
    let cdata = med_rec.length
    let cnull = 0
    let cfalse = 0
    let ctrue = 0

    for (let o of med_rec) {
      let foundind = med_list.findIndex(obj => obj.key === o['medical_id']);
      if (foundind === -1) {
        med_list.push({
          key: o['medical_id'],
          med_name: o['med_name'],
          dose: o['dose'],
          status: o['status']
        })
      }
      else {
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

      if (cnull > 0) {
        prescriptionRecords['med_rec'].push({
          "submit_date": reformat_date(o['submit_date']),
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": JSON.parse(JSON.stringify(med_list.sort((a,b) => a.key - b.key)))
        })
      }
      else if (cfalse > 0) {
        prescriptionRecords['med_rec'].push({
          "submit_date": reformat_date(o['submit_date']),
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": JSON.parse(JSON.stringify(med_list.sort((a,b) => a.key - b.key)))
        })
      }
      else if (ctrue === cdata) {
        prescriptionRecords['med_rec'].push({
          "submit_date": reformat_date(o['submit_date']),
          "ctrue": ctrue,
          "cfalse": cfalse,
          "cnull": cnull,
          "list": JSON.parse(JSON.stringify(med_list.sort((a,b) => a.key - b.key)))
        })
      }

      prescriptionRecords['doctor'] = (prescriptionRecords['doctor'] !== undefined && prescriptionRecords['doctor'].length > 0)?`${prescriptionRecords['doctor']}, ${o['doctor']}`:o['doctor']
    }

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
    var start_date = req.query.start_date
    var end_date = req.query.end_date
  }
  catch (err) {
    console.error(err);
    res.status(400).send('Invalid Query Key')
  }
  try {
    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, patient_name, hospital_unit, submit_date AT TIME ZONE 'ALMST' AS submit_date, login_id FROM prescription_records WHERE $1<=submit_date AND submit_date<=$2", [start_date, end_date])
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
          "submit_date": reformat_date(data["submit_date"]),
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
          "submit_date": reformat_date(data["submit_date"]),
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
          "submit_date": reformat_date(data["submit_date"]),
          "status": parse_status("success"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else {
      }
    }

    var uniq = [...new Set(hospital_unit)];
    
    let summary = {
      success: cptrue*100/cpdata,
      warning: cpnull*100/cpdata,
      error: cpfalse*100/cpdata
    }

    if (isNaN(summary.success) || summary.success == null) {
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
          res.status(400).send('Invalid data format in med_information Key')
        }
        else{
          io.emit('update');
          res.status(201).send("Prescript id : "+ prescript_id)
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