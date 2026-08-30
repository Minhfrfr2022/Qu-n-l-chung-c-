const axios = require("axios");

async function test_query() {
    try {
        const res = await axios.get("http://localhost:3001/api/vehicles/query-by-apt", {      
            params: {
                apt_id: "0A-0"
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
        const res = await axios.get("http://localhost:3001/api/vehicles/count-by-apt-type", {      
            params: {
                apt_id: "0A-0",
                type: "car"
            }
        });
        console.log("Response:", typeof res.data.count);
    } catch (err) {
        console.log(err);
    }
}

test_query_with_type();

