const axios = require("axios");


function dateConvert(time) {
    return new Date(time).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}


async function test_insert() {
    try {
        const res = await axios.post("http://localhost:3001/api/vehicles/insert-request", {      
            apt_id: "0A-0",
            owner: "admin1",
            type: "",
            number: "99A-1444414",
            color: "yellow"
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

//test_insert();


async function test_query_by_apt() {
    try {
        const res = await axios.get("http://localhost:3001/api/vehicles/query-request-by-apt", {      
            params: {
                apt_id: "0A-0",
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}


//test_query_by_apt();

async function test_query_all_request() {
    try {
        const res = await axios.get("http://localhost:3001/api/vehicles/query-all-request", {      
            params: {
                page_number: 1,
                page_size: 5
            }
        });
        console.log("Response:", res.data.result);
    } catch (err) {
        console.log(err);
    }
}

test_query_all_request();