const axios = require("axios");

async function test_update() {
    try {
        const res = await axios.patch("http://localhost:3001/api/vehicles/update", {      
            number: "29A-12312",
            new_values: {
                color: "white",
                type: "electric-bike"
            }
        });
        console.log("Response:", res.data);
    } catch (err) {
        console.log(err);
    }
}

test_update();