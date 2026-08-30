const axios = require("axios");
const test = require("node:test");

async function test_update() {
    try {
        const res = await axios.patch("http://localhost:3001/api/bills/update", {      
            apt_id: "A0-A",
            bill: {
                electric: 22222,
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}



async function test_update2() {
    try {
        const res = await axios.patch("http://localhost:3001/api/bills/reset", {      
            apt_id: "A0-1",
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

async function test_sum() {
    try {
        const res = await axios.get("http://localhost:3001/api/bills/query-all-collected", {      
        
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

//test_sum();

async function test_collect() {
    try {
        const res = await axios.post("http://localhost:3001/api/bills/collect-bill", {      
            apt_id: "A0-1",
            total: "100"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}
test_collect();