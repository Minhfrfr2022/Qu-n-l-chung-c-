const axios = require("axios");

async function test_query() {
    try {
        const res = await axios.get("http://localhost:3001/api/vehicles/query-by-owner", {      
            params: {
                owner: "admin1"
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

//test_query();

async function test_query_with_type() {
    try {
        const res = await axios.get("http://localhost:3001/api/vehicles/query-by-owner-type", {      
            params: {
                owner: "admin1",
                type: "bike"
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_query_with_type();