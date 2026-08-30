const axios = require("axios");

async function test_query_all() {
    try {
        const res = await axios.get("http://localhost:3001/api/bills/query-with-filter", {      
            params: {
                page_number: 1,
                page_size: 5,
                filter: {
                    owner: "duong_user",
                    
                }
            }
        });
        console.log(res.data.result);

    } catch (err) {
        console.log(err);
    }
}

test_query_all();