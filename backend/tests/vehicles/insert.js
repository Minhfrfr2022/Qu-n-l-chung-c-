const axios = require("axios");

async function test_insert() {
    try {
        const res = await axios.post("http://localhost:3001/api/vehicles/insert", {      
            apt_id: "0A-0",
            owner: "admin1",
            type: "bike",
            number: "99A-1122",
            color: "yellow"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_insert();