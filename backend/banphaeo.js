var http = require('http');
var format = require('pg-format')

module.exports = function (app, client) {

  
 
  app.get("/hw_prescript", async (req, res) => {

    const prescript_id = req.query.id
    const login_id = req.query.login_id

    function banphaeo_prescript(cb) {
      
      var host = 'http://checkup.bphosp.or.th/emrphaeo/checkupOnline/main/pharmacyQueueHeadInfo.php?queueInfo='
   
      http.request(host + prescript_id).on('response', function(response) {
          var data = '';
          response.on("data", function (chunk) {
              data += chunk;
          });
          response.on('end', function () {
              var pCJSON = JSON.parse(data);
              cb(pCJSON);
          });
      }).end();
    }

    banphaeo_prescript(function(pCLatLng){ 

      // Insert prescription_records database
      const text_preds = 'INSERT INTO prescription_records (prescript_no, waiting_queue, patient_name, hn, age, hospital_unit, login_id) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *'
      const values_preds = [pCLatLng.pharmacyQueueNo, prescript_id.split('-')[1], pCLatLng.patientName, pCLatLng.hn, '-', '-', req.query.login_id]
      client.query(text_preds, values_preds, (error, results) => {
        if(error){
            // console.log(error)
            res.status(400).send('User not Found')
        }
        else{ 
            // FK in medicine_records
            // console.log(results.rows[0])
            const prescript_id = JSON.stringify(results.rows[0].login_id)

            const med_list = pCLatLng.drugName
            const doctor_list = pCLatLng.drOrders

            var insert_medicine_records = []
            for(var i = 0; i < med_list.length; i++) {
              var med = med_list[i]
              var dose = '1'
              var doctor = doctor_list[i]
              insert_medicine_records.push(new Array(med, dose, doctor, prescript_id))
            }

            client.query(format('INSERT INTO medicine_records (med_name, dose, doctor, prescript_id) VALUES %L', insert_medicine_records),[], (error, results)=>{
              if(error){
                  res.status(400).send('Invalid data format in med_information Key')
              }   
              else{
                  //io.emit('update');
                  res.status(201).send("Prescript id : "+ prescript_id)
              }
            }); 
        }
      });
    });
  });


}


