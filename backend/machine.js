
module.exports = function (app, client, io) {
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

	//Prescription
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

	//3. Meidicine records
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
}
