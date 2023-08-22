module.exports = function (app, client) {
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

  app.post("/clear_records", async (req, res) => {


   const results_medicine_records = await client
      .query("DELETE FROM medicine_records")
      .then((payload) => {
        return payload.rows;
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Delete medicine_records records failed.");
        throw new Error("Delete medicine_records records failed.");
      });

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify("Success"));

    const results_prescription_records = await client
      .query("DELETE FROM prescription_records")
      .then((payload) => {
        return payload.rows;
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Delete prescription_records records failed.");
        throw new Error("Delete prescription_records records failed.");
      });


    const results_login_records = await client
      .query("DELETE FROM login_records")
      .then((payload) => {
        return payload.rows;
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Delete login_records records failed.");
        throw new Error("Delete login_records records failed.");
      });

    res.setHeader("Content-Type", "application/json");
    res.status(200);
    res.send(JSON.stringify("Success"));
  });



}