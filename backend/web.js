// Parameter
const otp_expired = 900000; // 15 mins

module.exports = function (app, client, io, moment, axios, jwt, http_server) {

  // Functions
  function reformat_date(mydt) {
    // dd/MM/yyyy hh:mm:ss
    return `${mydt.getDate()}/${(mydt.getMonth() < 9 ? "0" : "") + (mydt.getMonth() + 1)
      }/${mydt.getFullYear()} ${(mydt.getHours() < 10 ? "0" : "") + mydt.getHours()
      }:${(mydt.getMinutes() < 10 ? "0" : "") + mydt.getMinutes()}:${(mydt.getSeconds() < 10 ? "0" : "") + mydt.getSeconds()
      }`;
  }

  function randomLongString(num) {
    const alp = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array(num)
      .fill(0)
      .map(() => alp[Math.floor(Math.random() * alp.length)])
      .join("");
  }

  function randomLongInt(num) {
    const alp = "0123456789";
    return Array(num)
      .fill(0)
      .map(() => alp[Math.floor(Math.random() * alp.length)])
      .join("");
  }

  function generateAccessToken(data) {
    return jwt.sign(data, process.env.JWT_SECRET, { algorithm: 'HS256' });
  }

  // Middlewares
  function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).send({ "success": false, "msg": "Unauthorized user." });


    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

      if (err) {
        //console.log('err :>> ', err);
        //console.log('token :>> ', token);
        return res.status(403).send({ "success": false, "msg": "Forbidden user." });
      }

      client
        .query("SELECT user_id, name, surname, email, tel_number, role, registration_date FROM users WHERE user_id=$1", [user.sub])
        .then((results) => {
          if (results.rows.length != 1) res.status(401).send({ "success": false, "msg": "Unauthorized user." });
          else {
            req.user = results.rows[0];
            next();
          }
        });
    });
  }

  app.use((req, res, next) => {
    // if (!req.originalUrl.includes('socket.io')) 
    console.log(`[ LOG ] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Login page
  app.post("/web_register", async (req, res) => {
    const text =
      "INSERT INTO users(name, surname, email, password, tel_number, role) VALUES($1, $2, $3, $4, $5, $6) RETURNING *";
    const values = [
      req.query.name,
      req.query.surname,
      req.query.email,
      req.query.password,
      req.query.tel_number,
      req.query.role,
    ];
    //console.log(values)
    client.query(text, values, (error, results) => {
      if (error) {
        //console.log(error)
        res.status(400).send("Invalid Key");
      } else {
        res.status(201).send(`Add Register Complete`);
      }
    });
  });

  app.post("/web_login", async (req, res) => {
    try {
      const results = await client
        .query("SELECT user_id, name, surname, email, tel_number, role, registration_date FROM users WHERE email=$1 AND password=$2", [
          req.body.email,
          req.body.password,
        ])
        .then((payload) => {
          return payload.rows;
        });

      if (results.length == 1) {
        const token = generateAccessToken({ "sub": results[0]["user_id"], "iat": Date.now() });
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(
          JSON.stringify({
            success: true,
            token: token,
            profile: results[0],
          })
        );
      } else {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(
          JSON.stringify({
            success: false,
            result: results
          })
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.post("/web_password/request_reset", async (req, res) => {
    try {
      var email = req.query.email;
      var iat = req.query.iat;
    } catch (err) {
      console.error(err);
      res.status(400).send("Invalid Query Key");
      throw new Error("Invalid Query Key");
    }

    try {
      const otp = randomLongInt(6);
      const otp_ref = randomLongString(4);
      const results = await client
        .query(
          'UPDATE users SET otp = otp::jsonb || concat(\'{"ref":"\',$1::text,\'","val":"\',$2::text,\'","iat":"\',$3::text,\'"}\')::jsonb WHERE email=$4::text RETURNING user_id',
          [otp_ref, otp, iat, email]
        )
        .then((payload) => {
          return payload.rows;
        });

      if (results.length === 1) {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(
          JSON.stringify({
            success: true,
            usesr_id: results[0].user_id,
            otp_ref: otp_ref,
            otp_expired_ms: otp_expired
          })
        );

        await axios({
          "method": "post",
          "url": "https://apis.psyjai.com/sendemail",
          "params": {
            "reciever_email": email,
            "title": "Banphaeo Dashboard : Reset password request",
            "content": `คุณส่งคำขอเปลี่ยนรหัสผ่าน OTP คือ ${otp} (ref code: ${otp_ref}) กรุณาดำเนินการภายใน ${otp_expired / 60000} นาที`
          }
        });
      } else if (results.length === 0) {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(
          JSON.stringify({
            success: false,
            msg: "No data to be updated.",
          })
        );
      } else {
        res.setHeader("Content-Type", "application/json");
        res.status(200).send(
          JSON.stringify({
            success: false,
            msg: "Duplicate email on user_id: " + results.toString(),
          })
        );
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.post("/web_password/otp_validation", async (req, res) => {
    try {
      var email = req.query.email;
      var otp = req.query.otp;
    } catch (err) {
      console.error(err);
      res.status(400).send("Invalid Query Key");
      throw new Error("Invalid Query Key");
    }

    try {
      const results = await client
        .query("SELECT otp->>'val'=$1 as is_valid, user_id, password FROM users WHERE email=$2 AND otp->>'iat'>$3", [otp, email, Date.now() - otp_expired])
        .then((payload) => {
          return payload.rows[0];
        });
      if (!results) res.status(200).send({ "status": false, "msg": "No matched email or OTP expired." });
      else if (results.is_valid == true) {
        const token = generateAccessToken({ "sub": results["user_id"], "iat": Date.now() });
        res.status(200).send({ "status": results.is_valid, "msg": "valid", "token": token });
      }
      else res.status(200).send({ "status": results.is_valid, "msg": "invalid" });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.put("/web_password", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query("UPDATE users SET password=$1::text WHERE user_id=$2", [
          req.query.data,
          req.user.user_id,
        ])
        .then((payload) => {
          if (payload.rowCount > 0) {
            return { success: true, msg: `Updated ${payload.rowCount} data.` };
          } else {
            return { success: false, msg: "No data updated." };
          }
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.get("/web_validate_email", async (req, res) => {
    try {
      format = String(req.query.email)
        .toLowerCase()
        .match(
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );

      if (!format) {
        res.status(422).send("Invalid data format.");
        return;
      }

      const results = await client
        .query("SELECT count(1) FROM users WHERE email=$1", [req.query.email])
        .then((payload) => {
          return payload;
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results.rows[0]["count"]));
      return;
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  // Dashboard page
  app.get("/web_queue_cards", authenticateToken, async (req, res) => {
    try {
      let cards = {
        success: [],
        error: [],
        warning: [],
      };

      // get all prescription records
      const prescriptionRecords = await client
        .query(
          `WITH RankedPrescriptions AS (
            SELECT 
              prescript_id, 
              prescript_no, 
              waiting_queue,
              status, 
              submit_date AT TIME ZONE 'ALMST' AS submit_date, 
              login_id,
              ROW_NUMBER() OVER (PARTITION BY prescript_no ORDER BY submit_date DESC) AS row_num
            FROM prescription_records
          )
          SELECT 
            prescript_id, 
            prescript_no, 
            waiting_queue, 
            status,
            submit_date, 
            login_id
          FROM RankedPrescriptions
          WHERE row_num = 1
          ORDER BY submit_date ASC
          LIMIT 150;
          `
        )
        .then((payload) => {
          return payload.rows;
        });

      // loop through all prescription records
      let i = prescriptionRecords.length;
      while (i--) {
        // do not show if status is not true
        if (!prescriptionRecords[i].status) {
          continue;
        }

        // get all medicine records that matched with prescript_id
        let med_status = await client
          .query(
            "SELECT medical_id, status, submit_date AT TIME ZONE 'ALMST' FROM medicine_records WHERE prescript_id=$1",
            [prescriptionRecords[i].prescript_id]
          )
          .then((payload) => {
            return payload.rows;
          });

        let cdata = med_status.length;

        // add all med record to a related prescription record
        prescriptionRecords[i]["med_status"] = med_status;

        let cnull = 0;
        let cfalse = 0;
        let ctrue = 0;

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
          pid: prescriptionRecords[i]["prescript_id"],
          queueId: prescriptionRecords[i]["waiting_queue"],
          prescriptId: prescriptionRecords[i]["prescript_no"],
          numAll: cdata,
          dt: reformat_date(prescriptionRecords[i]["submit_date"]),
        };

        if (cdata !== cnull && cnull > 0) {
          cards["warning"].push({ ...cobj, "numPart": cnull });
          continue;
        } else if (cfalse > 0) {
          cards["error"].push({ ...cobj, "numPart": cfalse });
          continue;
        } else if (ctrue === cdata) {
          cards["success"].push({ ...cobj, "numPart": ctrue });
          continue;
        } else {
          console.log(
            `Prescription ID ${prescriptionRecords[i]["prescript_id"]} was ignored. cdata=${cdata} cnull=${cnull}`
          );
        }
      }

      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(cards));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.get("/web_prescription_record/:id", authenticateToken, async (req, res) => {
    try {
      let card = {};

      // get all prescription records that related to a prescript_id
      let prescriptionRecords = await client
        .query(
          `SELECT prescript_id, prescript_no, waiting_queue, patient_name, 
            hn, age, hospital_unit, login_id, 
            submit_date AT TIME ZONE 'ALMST' AS submit_date 
          FROM prescription_records 
          WHERE prescript_no = (SELECT prescript_no 
            FROM prescription_records 
            WHERE prescript_id=$1) 
          ORDER BY prescript_id DESC`,
          [req.params.id]
        )
        .then((payload) => {
          return payload.rows;
        });
      if (prescriptionRecords.length < 1) {
        res.status(200).send(null);
        return;
      }
      card = prescriptionRecords[0];
      card["med_rec"] = [];

      // loop through all prescription records
      let i = prescriptionRecords.length;
      while (i--) {
        // get all medicine records that matched with prescript_id
        let med_status = await client
          .query(
            "SELECT medical_id, med_name, dose, doctor, status, prescript_id, submit_date AT TIME ZONE 'ALMST' AS submit_date FROM medicine_records WHERE prescript_id=$1 ORDER BY medical_id ASC",
            [prescriptionRecords[i].prescript_id]
          )
          .then((payload) => {
            return payload.rows;
          });

        // count status of med record
        let cnull = 0;
        let cfalse = 0;
        let ctrue = 0;

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
        medlist = [];
        med_status.forEach((val, ind, _) => {
          medlist.push({
            key: val["medical_id"],
            med_name: val["med_name"],
            dose: val["dose"],
            status: val["status"],
          });
          card["doctor"] =
            card["doctor"] !== undefined &&
              card["doctor"].length > 0 &&
              !card["doctor"].includes(val["doctor"])
              ? `${card["doctor"]}, ${val["doctor"]}`
              : val["doctor"];
        });

        // append med record in card
        card["med_rec"].push({
          submit_date: reformat_date(prescriptionRecords[i]["submit_date"]),
          ctrue: ctrue,
          cfalse: cfalse,
          cnull: cnull,
          list: medlist,
        });
      }

      card["submit_date"] = card["med_rec"][0]["submit_date"];
      card["call"] =
        card["med_rec"][0]["ctrue"] +
        card["med_rec"][0]["cfalse"] +
        card["med_rec"][0]["cnull"];
      card["ctrue"] = card["med_rec"][card["med_rec"].length - 1]["ctrue"];
      card["cerror"] = card["med_rec"][card["med_rec"].length - 1]["cfalse"];
      card["cwarning"] = card["med_rec"][card["med_rec"].length - 1]["cnull"];

      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(card));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  // Stat page
  app.get("/web_prescription_stats", authenticateToken, async (req, res) => {
    try {
      var start_date = req.query.start_date;
      var end_date = req.query.end_date;
    } catch (err) {
      console.error(err);
      res.status(400).send("Invalid Query Key");
      throw new Error("Invalid Query Key");
    }

    try {
      // get all prescription record
      const prescriptionRecords = await client
        .query(
          "SELECT prescript_id, prescript_no, waiting_queue, patient_name, hospital_unit, submit_date AT TIME ZONE 'ALMST' AS submit_date, login_id FROM prescription_records WHERE $1<=submit_date AND submit_date<=$2",
          [start_date, end_date]
        )
        .then((payload) => {
          return payload.rows;
        });

      // declare neccessary vars and funcs
      let table = [];
      let hospital_unit = [];
      let idInCardList = [];

      let i = prescriptionRecords.length;

      let cpdata = 0;
      let cpnull = 0;
      let cpfalse = 0;
      let cptrue = 0;

      function parse_status(stat) {
        switch (stat) {
          case "success":
            return "ถูกต้อง";

          case "warning":
            return "สูญหาย";

          case "error":
            return "ผิดพลาด";

          default:
            return null;
        }
      }

      // loop through data
      while (i--) {
        // check duplicated prescription record
        if (idInCardList.includes(prescriptionRecords[i].prescript_no))
          continue;
        else idInCardList.push(prescriptionRecords[i].prescript_no);
        cpdata++;

        // get all medicine records that matched with prescript_id
        let med_status = await client
          .query(
            "SELECT medical_id, status, submit_date AT TIME ZONE 'ALMST' FROM medicine_records WHERE prescript_id=$1",
            [prescriptionRecords[i].prescript_id]
          )
          .then((payload) => {
            return payload.rows;
          });

        let cdata = med_status.length;
        let tnow = moment().add(7, "h");
        let trec = moment(prescriptionRecords[i]["submit_date"]);
        let tdiff = moment.duration(tnow.diff(trec)).asMinutes();

        // manage the rest of datas
        hospital_unit.push({
          text: prescriptionRecords[i]["hospital_unit"],
          value: prescriptionRecords[i]["hospital_unit"],
        });

        let cnull = 0;
        let cfalse = 0;
        let ctrue = 0;

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
            submit_date: reformat_date(prescriptionRecords[i]["submit_date"]),
            status: parse_status("warning"),
            num: `${ctrue}/${cdata}`,
            numPart: ctrue,
            numAll: cdata,
          });
          continue;
        } else if (cfalse > 0) {
          cpfalse++;
          table.push({
            ...prescriptionRecords[i],
            submit_date: reformat_date(prescriptionRecords[i]["submit_date"]),
            status: parse_status("error"),
            num: `${ctrue}/${cdata}`,
            numPart: ctrue,
            numAll: cdata,
          });
          continue;
        } else if (ctrue === cdata) {
          cptrue++;
          table.push({
            ...prescriptionRecords[i],
            submit_date: reformat_date(prescriptionRecords[i]["submit_date"]),
            status: parse_status("success"),
            num: `${ctrue}/${cdata}`,
            numPart: ctrue,
            numAll: cdata,
          });
          continue;
        } else {
          console.log(
            `Prescription ID ${prescriptionRecords[i]["prescript_id"]} is ignored. cdata=${cdata} cnull=${cnull} tdiff=${tdiff}`
          );
        }
      }

      var uniq = hospital_unit.filter(
        (v, i, a) =>
          a.findIndex((v2) => JSON.stringify(v2) === JSON.stringify(v)) === i
      );

      let summary = {
        success: (cptrue * 100) / cpdata,
        error: (cpfalse * 100) / cpdata,
        warning: (cpnull * 100) / cpdata,
      };

      if (isNaN(summary.success) || summary.success == null) {
        summary.success = 0;
      }
      if (isNaN(summary.warning) || summary.warning == null) {
        summary.warning = 0;
      }
      if (isNaN(summary.error) || summary.error == null) {
        summary.error = 0;
      }

      res.setHeader("Content-Type", "application/json");
      res.status(200).send(
        JSON.stringify({
          options: uniq,
          chart: [
            {
              type: "ถูกต้อง",
              value: cptrue,
            },
            {
              type: "ผิดพลาด",
              value: cpfalse,
            },
            {
              type: "สูญหาย",
              value: cpnull,
            },
          ],
          summary: summary,
          table: table,
        })
      );
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  // Accounts page
  app.get("/web_user_rows", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query(
          "SELECT user_id AS id, concat(name, ' ', surname) AS name, CASE WHEN role='pharmacy' THEN 'เภสัชกร' WHEN role='staff' THEN 'เจ้าหน้าที่' ELSE NULL END AS type FROM users WHERE role <> 'admin'"
        )
        .then((payload) => {
          return payload.rows;
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.get("/web_user/:id", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query(
          "SELECT user_id, name, surname, email, tel_number, role FROM users WHERE user_id=$1",
          [req.params.id]
        )
        .then((payload) => {
          if (payload.rowCount < 1) {
            return null;
          } else {
            return JSON.stringify(payload.rows[0]);
          }
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(results);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.delete("/web_user/:id", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query("DELETE FROM users WHERE user_id=$1", [req.params.id])
        .then((payload) => {
          if (payload.rowCount > 0) {
            return { success: true, msg: `Removed ${payload.rowCount} data.` };
          } else {
            return { success: false, msg: "No data removed." };
          }
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  // Main navigation
  app.get("/web_me", authenticateToken, async (req, res) => {
    res.status(200).send(req.user);
  });

  app.put("/web_user/:id/password", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query("UPDATE users SET password=$1 WHERE user_id=$2", [
          req.query.data,
          req.params.id,
        ])
        .then((payload) => {
          if (payload.rowCount > 0) {
            return { success: true, msg: `Updated ${payload.rowCount} data.` };
          } else {
            return { success: false, msg: "No data updated." };
          }
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });

  app.put("/web_user/:id/profile", authenticateToken, async (req, res) => {
    try {
      const results = await client
        .query(
          "UPDATE users SET name=$1, surname=$2, tel_number=$3, role=$4, email=$5 WHERE user_id=$6",
          [
            req.query.name,
            req.query.surname,
            req.query.tel_number,
            req.query.role,
            req.query.email,
            req.params.id,
          ]
        )
        .then((payload) => {
          if (payload.rowCount > 0) {
            return { success: true, msg: `Updated ${payload.rowCount} data.` };
          } else {
            return { success: false, msg: "No data updated." };
          }
        });
      res.setHeader("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(results));
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error.");
      throw new Error("Query failed");
    }
  });
};
