var http = require('http');
var format = require('pg-format')

module.exports = function (app, client) {

  app.post("/hw_prescript", async (req, res) => {

    const prescript_no = req.body.prescript_no
    const login_id = req.body.login_id
    console.log(prescript_no)
    console.log(login_id)

    function banphaeo_prescript(cb) {
      
      var host = 'http://checkup.bphosp.or.th/emrphaeo/checkupOnline/main/pharmacyQueueHeadInfo.php?queueInfo='
   
      http.request(host + prescript_no).on('response', function(response) {

          var data = '';
          response.on("data", function (chunk) {
              data += chunk;
          });
          response.on('end', function () {
            try{
              var pCJSON = JSON.parse(data);
              // No data in prescription url
              if (pCJSON.drugName.length == 0){
                pCJSON = "";
              }
            }
            catch(error){
              // Return not in json format
              pCJSON = "";
            }  
            cb(pCJSON);
          });
      }).end();
    }

    banphaeo_prescript(function(pCLatLng){
      //console.log(pCLatLng.drugName.length)

      // Filter out invalid url
      if (pCLatLng != ""){
        // Insert prescription_records database
        const text_preds = 'INSERT INTO prescription_records (prescript_no, waiting_queue, patient_name, hn, age, hospital_unit, status, login_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *'
        const values_preds = [pCLatLng.pharmacyQueueNo, prescript_no.split('-')[1], pCLatLng.patientName, pCLatLng.hn, '0', 'ผู้ป่วยใน', '0' ,login_id]
        client.query(text_preds, values_preds, (error, results) => {
          if(error){
              // console.log(error)
              res.status(400).send('User not Found')
          }
          else{ 
              // FK in medicine_records
              //console.log(results)
              const prescript_id = JSON.stringify(results.rows[0].prescript_id)

              const med_list = pCLatLng.drugName
              const doctor_list = pCLatLng.drOrders
              const hn = pCLatLng.hn

              var insert_medicine_records = []

              for(var i = 0; i < med_list.length; i++) {
                var med = med_list[i]
                var dose = '0'
                var doctor = doctor_list[i]
                  insert_medicine_records.push(new Array(med, dose, doctor, prescript_id))
              }

              client.query(format('INSERT INTO medicine_records (med_name, dose, doctor, prescript_id) VALUES %L', insert_medicine_records),[], (error, results)=>{
                if(error){
                    res.status(400).send('Invalid prescript_no')
                }   
                else{
                    //io.emit('update');
                  var response = { 
                    "prescript_id"  :  prescript_id, 
                    "hn" : hn,
                    "medicine" :  med_list
                  }
                    res.status(201).send(response)
                }
            }); 
          }
        });
      }else{
        res.status(400).send('Invalid Prescript no')
      }
    });
  });

  app.post("/hw_prescript_demo", async (req, res) => {

    
    const login_id = req.body.login_id
    const hn = req.body.hn
    const patientName = req.body.patientName
    const pharmacyQueueNo = req.body.pharmacyQueueNo
    const countDrugBlisterPack = req.body.countDrugBlisterPack
    const drugName = req.body.drugName
    const drOrders = req.body.drOrders
  
    // Filter out invalid url
    if (login_id != ""){
      // Insert prescription_records database
      const text_preds = 'INSERT INTO prescription_records (prescript_no, waiting_queue, patient_name, hn, age, hospital_unit, status, login_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *'
      const values_preds = [pharmacyQueueNo, pharmacyQueueNo, patientName,hn, '0', 'ผู้ป่วยใน','0', login_id]

      client.query(text_preds, values_preds, (error, results) => {
        if(error){
            // console.log(error)
            res.status(400).send('User not Found')
        }
        else{ 
          // FK in medicine_records
          //console.log(results)
          const prescript_id = JSON.stringify(results.rows[0].prescript_id)

          const med_list = drugName
          const doctor_list = drOrders


          var insert_medicine_records = []

          for(var i = 0; i < med_list.length; i++) {
            var med = med_list[i]
            var dose = '0'
            var doctor = doctor_list[i]
            insert_medicine_records.push(new Array(med, dose, doctor, prescript_id))
          }

          client.query(format('INSERT INTO medicine_records (med_name, dose, doctor, prescript_id) VALUES %L', insert_medicine_records),[], (error, results)=>{
            if(error){
                res.status(400).send('Invalid prescript_no')
            }   
            else{
              //io.emit('update');
              var response = { 
                "prescript_id"  :  prescript_id, 
                "hn" : hn,
                "medicine" :  med_list
              }
                res.status(201).send(response)
            }
          }); 
        }
      });
    }
    else{
      res.status(400).send('Invalid Prescript no')
    }
  });


  app.post("/hw_medicine", async (req, res) => {

    const med_no  = req.body.med_no
   
    function banphaeo_medicine(cb) {
      
      var host = 'http://checkup.bphosp.or.th/emrphaeo/checkupOnline/main/drugInfo.php?orderInfoId='
   
      http.request(host + med_no).on('response', function(response) {
          var data = '';
          response.on("data", function (chunk) {
              data += chunk;
          });
          response.on('end', function () {
            try{
              var pCJSON = JSON.parse(JSON.parse(data));
              // No data in medicine url
              if (!("med_name" in pCJSON)){
                pCJSON = "";
              }
            }
            catch(error){
              pCJSON = "";
            }
            cb(pCJSON);
          });
      }).end();
    }

    banphaeo_medicine(function(pCLatLng){ 
      //console.log(pCLatLng)
      if(pCLatLng != ""){
        var hn = pCLatLng.hn
        var med_name = pCLatLng.med_name

        var response = { 
          "hn" : hn,
          "medicine" :  med_name
        }
 
        res.status(201).send(response)
      }else{
        res.status(400).send('Invalid med_no')
      }
      
    });
  });

  app.post("/hw_status", async(req, res) => {

    function yolo_model(cb) {

      const data = JSON.stringify({
        photo: req.body.photo
      });

      const options = {
        hostname: 'yolov8',
        path: '/model',
        port:'8081',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
      };

      const req_yolov8 = http.request(options, (res) => {
        let data = '';

        //console.log('Status Code:', res.statusCode);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            //console.log('Body: ', data);
            cb(data);
        });

      }).on("error", (err) => {
        console.log("Error: ", err.message);
      });

      req_yolov8.write(data);
      req_yolov8.end();
    }
    

    const med_name  = req.body.med_name
    const prescripts_id  = req.body.prescript_id
    const pred_cls = req.body.pred_cls
    const image = req.body.photo
    
    // Server model fill result attribute
    if (pred_cls == ""){
      yolo_model(function(pCLatLng){ 
        var result = ""

        pred_cls = pCLatLng

        if (pred_cls == med_name)
          result = "true"
        else
          result = "false"
        
        // Update status each medicine
        const text = "UPDATE medicine_records SET pred_cls = $1, status = $2, image = $3 WHERE prescript_id = $4 AND med_name = $5"
        const value = [pred_cls, result, image, prescripts_id, med_name]

        client.query(text, value, (error, results) => {
          if (error) 
              res.status(400).send('Invalid med_name')    
          else{
            //io.emit('update');
            // Return status each medicine
            const query = "SELECT med_name, status FROM medicine_records WHERE prescript_id =" + prescripts_id
  
            client.query(query, (error, results) => {
              if (error) {
                res.status(400).send('No prescript_id')
              } 
              else {  
                //io.emit('update');
                res.status(201).send(results.rows)
              }
            //console.log(results)
            })
          }
        })
      });
    }
    // Client model pass result attribute
    else{
      // Update status each medicine
      if (pred_cls == med_name)
        result = "true"
      else
        result = "false"

      const text = "UPDATE medicine_records SET pred_cls = $1, status = $2, image = $3 WHERE prescript_id = $4 AND med_name = $5"
      const value = [pred_cls, result, image, prescripts_id, med_name]

      client.query(text, value, (error, results) => {
        if (error) 
          res.status(400).send('Invalid med_name')    
        else{
          //io.emit('update');
          // Return status each medicine
          const query = "SELECT med_name, status FROM medicine_records WHERE prescript_id =" + prescripts_id
  
          client.query(query, (error, results) => {
            if (error) 
              res.status(400).send('No prescript_id')
            else {  
              //io.emit('update');
              res.status(201).send(results.rows)
            }
              //console.log(results)
          })
        }
      })
    }
  });

    app.get("/hw_model", async(req, res) => {

    function yolo_model(cb) {

      const data = JSON.stringify({
        photo: req.body.photo
      });

      const options = {
        hostname: 'yolov8',
        path: '/model',
        port:'8081',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
      };

      const req_yolov8 = http.request(options, (res) => {
        let data = '';

        //console.log('Status Code:', res.statusCode);

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Body: ', data);
            cb(data);
        });

      }).on("error", (err) => {
        console.log("Error: ", err.message);
      });

      req_yolov8.write(data);
      req_yolov8.end();
    }
    
    yolo_model(function(pCLatLng){
      res.status(201).send(pCLatLng)
    });
  
  });

  app.post("/hw_end", async (req, res) => {

    const prescript_id = req.body.prescript_id

    const text = "UPDATE prescription_records SET status = '1' WHERE prescript_id = $1"
    const value = [prescript_id]

    client.query(text, value, (error, results) => {
      if (error) 
          res.status(400).send('Invalid prescript_id')    
      else{
        //io.emit('update');
          res.status(201).send('Complete prescript_id : '+ prescript_id)       
      }
    });  
  });
}


