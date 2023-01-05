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
const cron = require('node-cron');
const moment = require("moment")

const port = 8080;
// const validate_mins = process.env.VALIDATE_MINS;
const validate_mins = 5;

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
    let idInCardList = []

    // get all prescription records
    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, submit_date AT TIME ZONE 'ALMST' AS submit_date, login_id FROM prescription_records ORDER BY submit_date ASC LIMIT 150")
      .then((payload) => {
        return payload.rows
      });

    // loop through all prescription records
    let i = prescriptionRecords.length
    while (i--) {

      // check duplicated prescription record
      if (idInCardList.includes(prescriptionRecords[i].prescript_no)) continue;
      else idInCardList.push(prescriptionRecords[i].prescript_no);

      // get all medicine records that matched with prescript_id
      let med_status = await client
        .query("SELECT medical_id, status, submit_date AT TIME ZONE 'ALMST' FROM medicine_records WHERE prescript_id=$1", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })
      
      let cdata = med_status.length
      let tnow = moment().add(7,"h")
      let trec = moment(prescriptionRecords[i]["submit_date"])
      let tdiff = moment.duration(tnow.diff(trec)).asMinutes()

      // check first med record which is added less than validate_mins mins
      let i2 = med_status.length
      while (i2--) {
        if (med_status[i2]["status"] === null && tdiff < validate_mins) {
          prescriptionRecords.splice(i, 1)
          i2 = -99
          break
        }
      }
      if (i2 === -99) {
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
      else if (tdiff > validate_mins) {
        cards["warning"].push(cobj);
        continue;
      }
      else {
        console.log(`Prescription ID ${prescriptionRecords[i]["prescript_id"]} was ignored. cdata=${cdata} cnull=${cnull} tdiff=${tdiff}`);
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
    let card = {}

    // get all prescription records that related to a prescript_id
    let prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, patient_name, hn, age, hospital_unit, login_id, submit_date AT TIME ZONE 'ALMST' AS submit_date FROM prescription_records WHERE prescript_no = (SELECT prescript_no FROM prescription_records WHERE prescript_id=$1) ORDER BY prescript_id DESC", [req.params.id])
      .then((payload) => {
        if (payload.rowCount > 0) {
          return payload.rows
        }
        else {
          res.status(200).send(null)
        }
      });
    card = prescriptionRecords[0]
    card['med_rec'] = []

    // loop through all prescription records
    let i = prescriptionRecords.length
    while (i--) {

      // get all medicine records that matched with prescript_id
      let med_status = await client
        .query("SELECT medical_id, med_name, dose, doctor, status, prescript_id, submit_date AT TIME ZONE 'ALMST' AS submit_date FROM medicine_records WHERE prescript_id=$1 ORDER BY medical_id ASC", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })

      let cdata = med_status.length
      let tnow = moment().add(7,"h")
      let trec = moment(prescriptionRecords[i]["submit_date"])
      let tdiff = moment.duration(tnow.diff(trec)).asMinutes()

      // check first med record which is added less than validate_mins mins
      let i2 = med_status.length
      while (i2--) {
        if (med_status[i2]["status"] === null && tdiff < validate_mins) {
          prescriptionRecords.splice(i, 1)
          i2 = -99
          break
        }
      }
      if (i2 === -99) {
        continue
      }

      // count status of med record
      let cnull = 0
      let cfalse = 0
      let ctrue = 0

      for (let o of med_status) {
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

      // create med list
      medlist = []
      med_status.forEach((val, ind, _) => {
        medlist.push({
          "key": val['medical_id'],
          "med_name": val['med_name'],
          "dose": val['dose'],
          "status": val['status']
        })
        card['doctor'] = (card['doctor'] !== undefined && card['doctor'].length > 0 && !card['doctor'].includes(val['doctor']))?`${card['doctor']}, ${val['doctor']}`:val['doctor']
      })

      // append med record in card
      card["med_rec"].push({
        "submit_date": reformat_date(prescriptionRecords[i]['submit_date']),
        "ctrue": ctrue,
        "cfalse": cfalse,
        "cnull": cnull,
        "list": medlist
      })
    }
    
    card['submit_date'] = card['med_rec'][0]['submit_date']
    card["call"] = card['med_rec'][0]['ctrue'] + card['med_rec'][0]['cfalse'] + card['med_rec'][0]['cnull']
    card["ctrue"] = card['med_rec'][card['med_rec'].length-1]['ctrue']
    card["cerror"] = card['med_rec'][card['med_rec'].length-1]['cfalse']
    card["cwarning"] = card['med_rec'][card['med_rec'].length-1]['cnull']

    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify(card));
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
    // get all prescription record
    const prescriptionRecords = await client
      .query("SELECT prescript_id, prescript_no, waiting_queue, patient_name, hospital_unit, submit_date AT TIME ZONE 'ALMST' AS submit_date, login_id FROM prescription_records WHERE $1<=submit_date AND submit_date<=$2", [start_date, end_date])
      .then((payload) => {
        return payload.rows
      });
    
    // declare neccessary vars and funcs
    let table = []
    let hospital_unit = []
    let idInCardList = []

    let i = prescriptionRecords.length

    let cpdata = 0
    let cpnull = 0
    let cpfalse = 0
    let cptrue = 0

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

    // loop through data
    while (i--) {

      // check duplicated prescription record
      if (idInCardList.includes(prescriptionRecords[i].prescript_no)) continue;
      else idInCardList.push(prescriptionRecords[i].prescript_no);
      cpdata++

      // get all medicine records that matched with prescript_id
      let med_status = await client
        .query("SELECT medical_id, status, submit_date AT TIME ZONE 'ALMST' FROM medicine_records WHERE prescript_id=$1", [prescriptionRecords[i].prescript_id])
        .then((payload) => {
          return payload.rows
        })
      
      let cdata = med_status.length
      let tnow = moment().add(7,"h")
      let trec = moment(prescriptionRecords[i]["submit_date"])
      let tdiff = moment.duration(tnow.diff(trec)).asMinutes()

      // check first med record which is added less than validate_mins mins
      let i2 = med_status.length
      while (i2--) {
        if (med_status[i2]["status"] === null && tdiff < validate_mins) {
          prescriptionRecords.splice(i, 1)
          i2 = -99
          break
        }
      }
      if (i2 === -99) {
        continue
      }

      // manage the rest of datas
      hospital_unit.push({
        "text":prescriptionRecords[i]["hospital_unit"],
        "value":prescriptionRecords[i]["hospital_unit"]
      })

      let cnull = 0
      let cfalse = 0
      let ctrue = 0

      for (let o of med_status) {
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

      if (cdata !== cnull && cnull > 0) {
        cpnull++;
        table.push({
          ...prescriptionRecords[i],
          "submit_date": reformat_date(prescriptionRecords[i]["submit_date"]),
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
          ...prescriptionRecords[i],
          "submit_date": reformat_date(prescriptionRecords[i]["submit_date"]),
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
          ...prescriptionRecords[i],
          "submit_date": reformat_date(prescriptionRecords[i]["submit_date"]),
          "status": parse_status("success"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else if (tdiff > validate_mins) {
        cpnull++;
        table.push({
          ...prescriptionRecords[i],
          "submit_date": reformat_date(prescriptionRecords[i]["submit_date"]),
          "status": parse_status("warning"),
          "num": `${ctrue}/${cdata}`,
          "numPart": ctrue,
          "numAll": cdata,
        })
        continue;
      }
      else {
        console.log(`Prescription ID ${prescriptionRecords[i]["prescript_id"]} is ignored. cdata=${cdata} cnull=${cnull} tdiff=${tdiff}`);
      }
    }

    var uniq = hospital_unit.filter((v,i,a)=>a.findIndex(v2=>(JSON.stringify(v2) === JSON.stringify(v)))===i)
    
    let summary = {
      success: cptrue*100/cpdata,
      error: cpfalse*100/cpdata,
      warning: cpnull*100/cpdata
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