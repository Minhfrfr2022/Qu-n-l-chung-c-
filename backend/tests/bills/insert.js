const axios = require("axios");

async function test_insert() {
    try {
        const res = await axios.post("http://localhost:3001/api/bills/insert", {      
            apt_id: "0A-3",
            owner: "admin1",
            electric: "200000",
            service: "30000",
            water: "40000",
            vehicles: "90000",
            pre_debt: "0"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_insert();