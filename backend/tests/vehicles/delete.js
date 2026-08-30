const axios = require("axios");

async function test_delete() {
    try {
        const res = await axios.post("http://localhost:3001/api/vehicles/delete", {      
            number: "30A-99999"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_delete();