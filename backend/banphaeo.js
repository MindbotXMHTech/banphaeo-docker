var http = require('http');

module.exports = function (app) {
  app.get("/banphaeo", async (req, res) => {

    const id = req.query.id
    // flag : 0 = prescription, flag : 1 = medicine
    const flag = req.query.flag

    if (flag == '0'){
      const url = 'http://checkup.bphosp.or.th/emrphaeo/checkupOnline/main/pharmacyQueueHeadInfo.php?queueInfo=' 
    
      const request = http.request(url + id, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data = data + chunk.toString();
        });
  
        response.on('end', () => {
          const body = JSON.parse(data);
          //console.log(body);
          res.status(200).send(body)
        
        });
      })
  
      request.on('error', (error) => {
        //console.log('An error', error);
        res.status(400).send('API Banphaeo : Down')
      });
      request.end() 

    }else{
      const url = 'http://checkup.bphosp.or.th/emrphaeo/checkupOnline/main/drugInfo.php?orderInfoId='  
      const request = http.request(url + id, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data = data + chunk.toString();
        });
    
        response.on('end', () => {
          const body = JSON.parse(data);
          res.status(200).send(body)
          //console.log(body);
        });
      })
  
      request.on('error', (error) => {
        console.log('An error', error);
        res.status(400).send('API Banphaeo : Down')
      });
      request.end() 
    }
  });
}


