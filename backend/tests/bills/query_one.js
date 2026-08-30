const axios = require("axios");

async function test_query_one() {
    try {
        const res = await axios.get("http://localhost:3001/api/bills/query-one", {      
            params: {
                apt_id: "0A-2"
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_query_one();