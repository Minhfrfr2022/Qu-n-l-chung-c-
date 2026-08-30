const { supabaseAdmin } = require("../src/config/supabase");
async function testDB() {
    console.log("running");
    const {data, error} = await supabaseAdmin
                                .from("profiles")
                                .select("*")
                                .limit(1);
    if(error){
        console.error(error);
    }else{
        console.log("OK,", data);
    }
}
testDB();